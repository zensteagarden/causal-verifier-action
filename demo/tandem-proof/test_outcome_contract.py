"""The Noticer contract requires the real outcome behind the success claim."""

from order_service import create_order, get_order, reset_orders


def setup_function():
    reset_orders()


def test_success_response_requires_a_durable_order():
    result = create_order("order_123", 12500)

    assert result == {"status": "success", "order_id": "order_123"}

    persisted = get_order("order_123")
    assert persisted is not None
    assert persisted["order_id"] == "order_123"
    assert persisted["amount"] == 12500
    assert persisted["status"] == "created"


def test_unknown_order_is_not_reported_as_created():
    assert get_order("missing_order") is None
