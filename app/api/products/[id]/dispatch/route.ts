
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    const body = await request.json();
    const dispatchedBy =
      typeof body.dispatchedBy === "string"
        ? body.dispatchedBy.trim()
        : "";

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    if (!dispatchedBy) {
      return NextResponse.json(
        { error: "Dispatcher name is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        operations: {
          orderBy: { sequence: "asc" },
        },
        inspections: {
          include: { approval: true },
          orderBy: { createdAt: "desc" },
        },
        dispatches: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.dispatches.length > 0) {
      return NextResponse.json(
        { error: "This product has already been dispatched" },
        { status: 409 }
      );
    }

    if (product.operations.length === 0) {
      return NextResponse.json(
        { error: "Cannot dispatch without production operations" },
        { status: 409 }
      );
    }

    const now = new Date();

    const incompleteOperation = product.operations.find(
      (operation) =>
        operation.status !== "COMPLETED" ||
        !operation.holdUntil ||
        operation.holdUntil > now
    );

    if (incompleteOperation) {
      return NextResponse.json(
        {
          error:
            `Operation "${incompleteOperation.name}" is incomplete or its hold period has not elapsed.`,
        },
        { status: 409 }
      );
    }

    const finalInspection = product.inspections.find(
      (inspection) => inspection.parameter === "Final PDI"
    );

    if (!finalInspection) {
      return NextResponse.json(
        { error: "Final PDI inspection is required before dispatch" },
        { status: 409 }
      );
    }

    if (finalInspection.status !== "PASS") {
      return NextResponse.json(
        { error: "Final PDI inspection must PASS before dispatch" },
        { status: 409 }
      );
    }

    if (finalInspection.approval?.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Final PDI must be approved by a supervisor before dispatch" },
        { status: 409 }
      );
    }

    const dispatch = await prisma.dispatch.create({
      data: {
        productId,
        dispatchedBy,
      },
    });

    return NextResponse.json(
      {
        message: "Product dispatch approved",
        dispatch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Dispatch failed:", error);

    return NextResponse.json(
      { error: "Dispatch failed" },
      { status: 500 }
    );
  }
}
