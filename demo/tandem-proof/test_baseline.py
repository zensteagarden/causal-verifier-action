"""The existing CI contract checks only the reported response."""

from order_service import create_order, reset_orders


def setup_function():
    reset_orders()


def test_create_order_reports_success():
    result = create_order("order_123", 12500)
    assert result == {"status": "success", "order_id": "order_123"}
