
from django.contrib import admin
from .models import (
    Product,
    Inspection,
    InspectionApproval,
    ProductionOperation,
    Dispatch,
)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("serial_number", "name", "created_at")
    search_fields = ("serial_number", "name")


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "parameter",
        "measured_value",
        "min_value",
        "max_value",
        "status",
    )
    list_filter = ("status",)
    search_fields = ("product__serial_number", "parameter")


@admin.register(InspectionApproval)
class InspectionApprovalAdmin(admin.ModelAdmin):
    list_display = ("inspection", "decision", "supervisor", "decided_at")
    list_filter = ("decision",)


@admin.register(ProductionOperation)
class ProductionOperationAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "name",
        "sequence",
        "status",
        "hold_minutes",
    )
    list_filter = ("status",)


@admin.register(Dispatch)
class DispatchAdmin(admin.ModelAdmin):
    list_display = ("product", "cleared", "dispatched_at")
    list_filter = ("cleared",)
