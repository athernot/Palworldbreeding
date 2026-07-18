"""
Internal helpers — safe JSON navigation for palworld-save-tools output.

Handles palworld-save-tools typed property envelope:
    {"type": "StructProperty", "value": <actual properties dict>}
    {"type": "MapProperty", "value": [{"key": ..., "value": ...}, ...]}
    {"type": "BoolProperty", "value": true}
    {"type": "NameProperty", "value": "Anubis"}
    {"type": "StrProperty", "value": "..."}

All functions return defaults instead of raising on missing keys.
"""

from __future__ import annotations

from typing import Any


def safe_get(d: Any, *keys: str | int, default: Any = None) -> Any:
    """Walk *d* through *keys* without raising KeyError / TypeError."""
    current = d
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)  # type: ignore[assignment]
        elif isinstance(current, list):
            idx = key if isinstance(key, int) else -1
            if 0 <= idx < len(current):
                current = current[idx]
            else:
                return default
        else:
            return default
    return current


def typed_value(prop: Any) -> Any:
    """
    If *prop* is a typed property envelope {"type": ..., "value": ...},
    return the inner .value. Otherwise return *prop* as-is.

    Works on dicts like:
        {"type": "IntProperty", "value": 42} -> 42
        {"type": "BoolProperty", "value": true} -> True
        {"type": "NameProperty", "value": "Anubis"} -> "Anubis"
        {"type": "StructProperty", "value": {...}} -> {...}
    """
    if isinstance(prop, dict) and "value" in prop and "type" in prop:
        return prop["value"]
    return prop


def is_typed_struct(prop: Any) -> bool:
    """Return True if *prop* looks like a StructProperty envelope."""
    return isinstance(prop, dict) and prop.get("type") == "StructProperty"


def iter_map_pairs(map_prop: Any) -> list[tuple[Any, Any]]:
    """
    Given a MapProperty envelope, return a list of (key, value) tuples.

    MapProperty shape (from palworld-save-tools):
        {"type": "MapProperty", "value": [{"key": ..., "value": ...}, ...]}
    """
    inner = typed_value(map_prop)
    if not isinstance(inner, list):
        return []
    pairs: list[tuple[Any, Any]] = []
    for entry in inner:
        if isinstance(entry, dict):
            pairs.append((entry.get("key"), entry.get("value")))
    return pairs


def guid_string(raw: object) -> str:
    """
    Normalise a GUID value to a lowercase string.

    Handles:
    - Plain string: "A1B2C3D4-..."
    - Typed StructProperty: {"struct_type": "Guid", "value": "A1B2C3D4-..."}
    - Dict with 'guid' key: {"guid": "A1B2C3D4-..."}
    """
    val = typed_value(raw)
    if isinstance(val, dict):
        val = val.get("guid", val.get("value", ""))
    if val is None:
        return ""
    return str(val).strip().lower()
