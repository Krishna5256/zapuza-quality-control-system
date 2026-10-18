
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const inspections = await prisma.inspection.findMany({
      include: {
        product: true,
        approval: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inspections);
  } catch (error) {
    console.error("Failed to fetch inspections:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productId = Number(body.productId);
    const measuredValue = Number(body.measuredValue);
    const minValue = Number(body.minValue);
    const maxValue = Number(body.maxValue);
    const parameter = body.parameter?.trim();

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !parameter ||
      !Number.isFinite(measuredValue) ||
      !Number.isFinite(minValue) ||
      !Number.isFinite(maxValue) ||
      minValue > maxValue
    ) {
      return NextResponse.json(
        { error: "Provide a valid product ID, parameter, measurement, and tolerance range." },
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

    const status =
      measuredValue >= minValue && measuredValue <= maxValue
        ? "PASS"
        : "FAIL";

    const inspection = await prisma.inspection.create({
      data: {
        productId,
        parameter,
        measuredValue,
        minValue,
        maxValue,
        status,
        notes:
          typeof body.notes === "string"
            ? body.notes.trim()
            : undefined,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error("Failed to create inspection:", error);
    return NextResponse.json(
      { error: "Failed to create inspection" },
      { status: 500 }
    );
  }
}
