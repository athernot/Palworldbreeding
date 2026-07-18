"""
Palworld Owned Pal Extractor.

Public API:
    extract(raw_json: dict) -> dict

Returns:
    {
        "worldName": "...",
        "characterName": "...",
        "ownedPals": [...]
    }

Read-only. Never touches save files. Only consumes already-decoded JSON.
"""

from __future__ import annotations

from typing import Any

from extractor.world import extract_world_name
from extractor.character import extract_character_name
from extractor.owned_pals import extract_owned_pals


def extract(raw_json: dict[str, Any]) -> dict[str, Any]:
    """
    Extract world name, character name, and owned pals from decoded JSON.

    *raw_json* is the full output of the save decoder:
        {
            "level_meta": {...},
            "level": {...},
            "players": {"<uid>.sav": {...}, ...}
        }

    Returns the final extract schema. Never raises — missing data yields
    empty strings / empty lists.
    """
    world_name = extract_world_name(raw_json.get("level_meta", {}))
    character_name = extract_character_name(raw_json)
    owned_pals = extract_owned_pals(raw_json)

    return {
        "worldName": world_name,
        "characterName": character_name,
        "ownedPals": owned_pals,
    }
