from __future__ import annotations
from typing import Any


def extract_character_name(raw_json: dict[str, Any]) -> str:
    """Extract player NickName.

    Primary: Level.sav CharacterSaveParameterMap — entry where IsPlayer=True.
    Path: pair.value.RawData.value.object.SaveParameter.value.NickName.value
    """
    level = raw_json.get("level", {})
    if not isinstance(level, dict):
        return ""

    try:
        wsd = level["properties"]["worldSaveData"]["value"]
        pairs = wsd["CharacterSaveParameterMap"]["value"]
    except (KeyError, TypeError):
        return ""

    for pair in pairs:
        try:
            sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
            if sp.get("IsPlayer", {}).get("value") is True:
                name = sp.get("NickName", {}).get("value", "")
                if name:
                    return name
        except (KeyError, TypeError, AttributeError):
            continue

    return ""
