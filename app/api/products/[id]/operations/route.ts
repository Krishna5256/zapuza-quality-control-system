
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const operations = await prisma.productionOperation.findMany({
      where: { productId },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error("Failed to fetch operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    const body = await request.json();

    const sequence = Number(body.sequence);
    const holdMinutes = Number(body.holdMinutes ?? 0);
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !name ||
      !Number.isInteger(sequence) ||
      sequence < 1 ||
      !Number.isInteger(holdMinutes) ||
      holdMinutes < 0
    ) {
      return NextResponse.json(
        { error: "Provide a valid product ID, operation name, positive sequence, and non-negative hold time." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const previousOperation =
      sequence > 1
        ? await prisma.productionOperation.findUnique({
            where: {
              productId_sequence: {
                productId,
                sequence: sequence - 1,
              },
            },
          })
        : null;

    if (sequence > 1 && !previousOperation) {
      return NextResponse.json(
        { error: "Create the previous operation first." },
        { status: 409 }
      );
    }

    const operation = await prisma.productionOperation.create({
      data: {
        productId,
        sequence,
        name,
        holdMinutes,
      },
    });

    return NextResponse.json(operation, { status: 201 });
  } catch (error) {
    console.error("Failed to create operation:", error);
    return NextResponse.json(
      { error: "Could not create operation. Check whether this sequence already exists." },
      { status: 400 }
    );
  }
}
