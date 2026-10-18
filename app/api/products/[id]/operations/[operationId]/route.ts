
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    operationId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id, operationId } = await params;
    const productId = Number(id);
    const opId = Number(operationId);
    const body = await request.json();
    const action = body.action;

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(opId) ||
      opId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid product or operation ID" },
        { status: 400 }
      );
    }

    if (!["START", "COMPLETE"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be START or COMPLETE" },
        { status: 400 }
      );
    }

    const operation = await prisma.productionOperation.findFirst({
      where: { id: opId, productId },
    });

    if (!operation) {
      return NextResponse.json(
        { error: "Operation not found for this product" },
        { status: 404 }
      );
    }

    if (action === "START") {
      if (operation.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending operations can be started" },
          { status: 409 }
        );
      }

      if (operation.sequence > 1) {
        const previous = await prisma.productionOperation.findUnique({
          where: {
            productId_sequence: {
              productId,
              sequence: operation.sequence - 1,
            },
          },
        });

        if (
          !previous ||
          previous.status !== "COMPLETED" ||
          !previous.holdUntil ||
          previous.holdUntil.getTime() > Date.now()
        ) {
          return NextResponse.json(
            {
              error:
                "Complete the previous operation and wait until its hold period has elapsed.",
            },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.productionOperation.update({
        where: { id: opId },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    }

    if (operation.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Only in-progress operations can be completed" },
        { status: 409 }
      );
    }

    const completedAt = new Date();
    const holdUntil = new Date(
      completedAt.getTime() + operation.holdMinutes * 60_000
    );

    const updated = await prisma.productionOperation.update({
      where: { id: opId },
      data: {
        status: "COMPLETED",
        completedAt,
        holdUntil,
      },
    });

    return NextResponse.json({
      ...updated,
      holdElapsed: holdUntil <= new Date(),
      message:
        operation.holdMinutes > 0
          ? "Operation completed. The hold period must elapse before the next operation."
          : "Operation completed.",
    });
  } catch (error) {
    console.error("Failed to update operation:", error);

    return NextResponse.json(
      { error: "Failed to update operation" },
      { status: 500 }
    );
  }
}
