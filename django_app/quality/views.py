
from django.shortcuts import render
from .models import Product, Inspection, InspectionApproval, ProductionOperation, Dispatch


def dashboard(request):
    context = {
        "total_products": Product.objects.count(),
        "total_inspections": Inspection.objects.count(),
        "passed_inspections": Inspection.objects.filter(status="PASS").count(),
        "failed_inspections": Inspection.objects.filter(status="FAIL").count(),
        "pending_approvals": Inspection.objects.filter(
            status="FAIL"
        ).exclude(approval__isnull=False).count(),
        "products": Product.objects.order_by("-created_at")[:5],
        "recent_inspections": Inspection.objects.select_related(
            "product"
        ).order_by("-inspected_at")[:10],
        "pending_operations": ProductionOperation.objects.filter(
            status="PENDING"
        ).count(),
        "dispatches": Dispatch.objects.select_related("product").all()[:5],
    }
    return render(request, "quality/dashboard.html", context)
