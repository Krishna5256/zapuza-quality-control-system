
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


class Product(models.Model):
    serial_number = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.serial_number} - {self.name}"


class Inspection(models.Model):
    STATUS_CHOICES = [
        ("PASS", "Pass"),
        ("FAIL", "Fail"),
    ]

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="inspections"
    )
    parameter = models.CharField(max_length=100)
    measured_value = models.FloatField()
    min_value = models.FloatField()
    max_value = models.FloatField()
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, editable=False
    )
    inspected_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.status = (
            "PASS"
            if self.min_value <= self.measured_value <= self.max_value
            else "FAIL"
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.serial_number} - {self.parameter}: {self.status}"


class InspectionApproval(models.Model):
    DECISION_CHOICES = [
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    inspection = models.OneToOneField(
        Inspection, on_delete=models.CASCADE, related_name="approval"
    )
    decision = models.CharField(max_length=10, choices=DECISION_CHOICES)
    supervisor = models.CharField(max_length=100)
    remarks = models.TextField(blank=True)
    decided_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.inspection} - {self.decision}"


class ProductionOperation(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("STARTED", "Started"),
        ("COMPLETED", "Completed"),
    ]

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="operations"
    )
    name = models.CharField(max_length=100)
    sequence = models.PositiveIntegerField()
    hold_minutes = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="PENDING"
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sequence"]
        unique_together = [("product", "sequence")]

    def save(self, *args, **kwargs):
        now = timezone.now()

        if self.status == "STARTED" and self.started_at is None:
            self.started_at = now

        if self.status == "COMPLETED" and self.completed_at is None:
            self.completed_at = now

        if self.status != "COMPLETED":
            self.completed_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.serial_number} - {self.name}"

class Dispatch(models.Model):
    product = models.OneToOneField(
        Product, on_delete=models.CASCADE, related_name="dispatch"
    )
    cleared = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if not self.cleared:
            return

        errors = {}

        inspections = self.product.inspections.all()


        if not inspections.exists():
            errors["cleared"] = (
                "Dispatch blocked: the product has no recorded inspections."
            )
        elif inspections.filter(status="FAIL").exists():
            errors["cleared"] = (
                "Dispatch blocked: one or more inspections have failed."
            )
        elif inspections.filter(approval__isnull=True).exists():
            errors["cleared"] = (
                "Dispatch blocked: inspections require supervisor approval."
            )
        elif inspections.exclude(approval__decision="APPROVED").exists():
            errors["cleared"] = (
                "Dispatch blocked: all inspections must be approved."
            )


        operations = list(self.product.operations.all())

        if not operations:
            errors["cleared"] = (
                "Dispatch blocked: no production operations are recorded."
            )
        else:
            for operation in operations:
                if operation.status != "COMPLETED":
                    errors["cleared"] = (
                        f"Dispatch blocked: {operation.name} is not completed."
                    )
                    break

                if operation.hold_minutes and operation.completed_at:
                    hold_end = operation.completed_at + timedelta(
                        minutes=operation.hold_minutes
                    )
                    if timezone.now() < hold_end:
                        errors["cleared"] = (
                            f"Dispatch blocked: the hold period for "
                            f"{operation.name} has not elapsed."
                        )
                        break

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.cleared:
            self.dispatched_at = self.dispatched_at or timezone.now()
        else:
            self.dispatched_at = None

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.serial_number} - Dispatch"
