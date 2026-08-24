import warnings


class PytestWarning(Warning):
    pass


PRIVATE = PytestWarning("A private pytest class or function was used.")


def check_ispytest(ispytest: bool) -> None:
    if not ispytest:
        warnings.warn(PRIVATE, stacklevel=2)
