import warnings

from warning_case import PytestWarning, check_ispytest


def count_frames(tb: object) -> int:
    count = 0
    while tb is not None:
        count += 1
        tb = tb.tb_next
    return count


def raise_and_count() -> int:
    with warnings.catch_warnings():
        warnings.simplefilter("error", PytestWarning)
        try:
            check_ispytest(False)
        except PytestWarning as error:
            return count_frames(error.__traceback__)
    raise AssertionError("warning did not raise as an error")


def test_warning_traceback_does_not_grow() -> None:
    first = raise_and_count()
    second = raise_and_count()
    assert second <= first
