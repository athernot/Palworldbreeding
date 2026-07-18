from __future__ import annotations
from typing import Any


def extract_world_name(level_meta: dict[str, Any]) -> str:
    """Extract WorldName from LevelMeta.sav.

    Path: properties.SaveData.value.WorldName.value
    """
    if not isinstance(level_meta, dict):
        return ""
    try:
        return level_meta["properties"]["SaveData"]["value"]["WorldName"]["value"] or ""
    except (KeyError, TypeError):
        return ""
