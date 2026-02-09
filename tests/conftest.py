"""Root conftest — re-exports fixtures from helpers module for pytest auto-discovery."""

from helpers import (  # noqa: F401
    js_project,
    py_project,
    buggy_project,
    messy_project,
    perf_project,
    undocumented_project,
    empty_project,
    para_project,
)
