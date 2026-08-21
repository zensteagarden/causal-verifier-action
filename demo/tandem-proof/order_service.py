"""Synthetic order workflow for the public tandem CI proof."""

_orders = {}


def reset_orders():
    _orders.clear()


def create_order(order_id: str, amount: int):
    record = {
        "order_id": order_id,
        "amount": amount,
        "status": "created",
    }
    # False success: the function reports success but never stores the record.
    return {"status": "success", "order_id": order_id}


def get_order(order_id: str):
    return _orders.get(order_id)
