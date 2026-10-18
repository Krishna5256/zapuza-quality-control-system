
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inspections: {
          include: {
            approval: true,
          },
          orderBy: {
            id: "desc",
          },
        },
        operations: {
          orderBy: {
            sequence: "asc",
          },
        },
        dispatches: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serialNumber = body.serialNumber?.trim();
    const name = body.name?.trim();

    if (!serialNumber || !name) {
      return NextResponse.json(
        { error: "Serial number and product name are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: { serialNumber, name },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);

    return NextResponse.json(
      {
        error:
          "Could not create product. Check whether the serial number already exists.",
      },
      { status: 400 }
    );
  }
}
