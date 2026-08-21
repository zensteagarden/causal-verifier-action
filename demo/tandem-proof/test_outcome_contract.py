"""The Noticer contract requires an observable order-store result."""

from order_service import create_order, get_order, reset_orders


def setup_function():
    reset_orders()


def test_success_response_requires_a_stored_order_record():
    result = create_order("order_123", 12500)

    assert result == {"status": "success", "order_id": "order_123"}

    stored = get_order("order_123")
    assert stored is not None
    assert stored["order_id"] == "order_123"
    assert stored["amount"] == 12500
    assert stored["status"] == "created"


def test_unknown_order_is_not_reported_as_created():
    assert get_order("missing_order") is None
