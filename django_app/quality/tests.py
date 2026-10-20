
from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone

from .models import Product, Inspection, InspectionApproval, ProductionOperation, Dispatch


class QualityControlTests(TestCase):

    
    def test_dispatch_blocked_until_hold_period_elapses(self):
        inspection = self.create_inspection(measured_value=10)

        InspectionApproval.objects.create(
            inspection=inspection,
            decision="APPROVED",
            supervisor="Test Supervisor",
        )

        operation = ProductionOperation.objects.create(
            product=self.product,
            name="Cooling",
            sequence=1,
            hold_minutes=30,
            status="COMPLETED",
        )

        # Simulate an operation completed only 5 minutes ago.
        ProductionOperation.objects.filter(pk=operation.pk).update(
            completed_at=timezone.now() - timedelta(minutes=5)
        )

        with self.assertRaises(ValidationError):
            Dispatch.objects.create(
                product=self.product,
                cleared=True,
            )

        # Simulate the hold period having elapsed.
        ProductionOperation.objects.filter(pk=operation.pk).update(
            completed_at=timezone.now() - timedelta(minutes=31)
        )

        dispatch = Dispatch.objects.create(
            product=self.product,
            cleared=True,
        )
        self.assertTrue(dispatch.cleared)

    
    def test_dispatch_blocked_without_supervisor_approval(self):
        inspection = self.create_inspection(measured_value=10)

        ProductionOperation.objects.create(
            product=self.product,
            name="Cutting",
            sequence=1,
            status="COMPLETED",
        )

        with self.assertRaises(ValidationError):
            Dispatch.objects.create(
                product=self.product,
                cleared=True,
            )

        InspectionApproval.objects.create(
            inspection=inspection,
            decision="APPROVED",
            supervisor="Test Supervisor",
            remarks="Inspection verified",
        )

        # Approval alone is not enough if the operation requirements fail.
        # This operation has no hold time, so it is eligible.
        dispatch = Dispatch.objects.create(
            product=self.product,
            cleared=True,
        )
        self.assertTrue(dispatch.cleared)

    def setUp(self):
        self.product = Product.objects.create(
            serial_number="PRD-TEST-001",
            name="Steel Component",
        )

    def create_inspection(self, measured_value=10, minimum=9, maximum=11):
        return Inspection.objects.create(
            product=self.product,
            parameter="Diameter",
            measured_value=measured_value,
            min_value=minimum,
            max_value=maximum,
        )

    def test_measurement_within_range_passes(self):
        inspection = self.create_inspection(measured_value=10)

        self.assertEqual(inspection.status, "PASS")

    def test_measurement_outside_range_fails(self):
        inspection = self.create_inspection(measured_value=12)

        self.assertEqual(inspection.status, "FAIL")

    def test_dispatch_blocked_when_inspection_fails(self):
        self.create_inspection(measured_value=12)

        ProductionOperation.objects.create(
            product=self.product,
            name="Cutting",
            sequence=1,
            status="COMPLETED",
        )

        with self.assertRaises(ValidationError):
            Dispatch.objects.create(
                product=self.product,
                cleared=True,
            )

    def test_dispatch_blocked_without_operations(self):
        self.create_inspection(measured_value=10)

        with self.assertRaises(ValidationError):
            Dispatch.objects.create(
                product=self.product,
                cleared=True,
            )

    def test_dispatch_blocked_when_operation_is_pending(self):
        self.create_inspection(measured_value=10)

        ProductionOperation.objects.create(
            product=self.product,
            name="Cutting",
            sequence=1,
            status="PENDING",
        )

        with self.assertRaises(ValidationError):
            Dispatch.objects.create(
                product=self.product,
                cleared=True,
            )
