
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const inspectionId = Number(id);
    const body = await request.json();

    if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
      return NextResponse.json(
        { error: "Invalid inspection ID" },
        { status: 400 }
      );
    }

    const decision = body.status;
    const reviewer = body.reviewer?.trim();
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    if (!reviewer) {
      return NextResponse.json(
        { error: "Supervisor name is required" },
        { status: 400 }
      );
    }

    if (decision === "REJECTED" && !reason) {
      return NextResponse.json(
        { error: "A rejection reason is required" },
        { status: 400 }
      );
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { approval: true },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: "Inspection not found" },
        { status: 404 }
      );
    }

    if (inspection.approval) {
      return NextResponse.json(
        { error: "This inspection has already been reviewed" },
        { status: 409 }
      );
    }

    const approval = await prisma.inspectionApproval.create({
      data: {
        inspectionId,
        status: decision,
        reviewer,
        reason: decision === "REJECTED" ? reason : null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Failed to review inspection:", error);
    return NextResponse.json(
      { error: "Failed to review inspection" },
      { status: 500 }
    );
  }
}
