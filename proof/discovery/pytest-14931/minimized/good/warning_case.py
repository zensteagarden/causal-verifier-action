import warnings


class PytestWarning(Warning):
    pass


class UnformattedWarning:
    def __init__(self, category: type[Warning], message: str) -> None:
        self.category = category
        self.message = message

    def format(self) -> Warning:
        return self.category(self.message)


PRIVATE = UnformattedWarning(
    PytestWarning,
    "A private pytest class or function was used.",
)


def check_ispytest(ispytest: bool) -> None:
    if not ispytest:
        warnings.warn(PRIVATE.format(), stacklevel=2)
