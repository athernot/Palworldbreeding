from __future__ import annotations
from typing import Any


def extract_owned_pals(raw_json: dict[str, Any]) -> list[str]:
    """Return sorted, deduplicated list of owned pal species names.

    Strategy:
      1. Collect player UID from Level.sav (IsPlayer entry's PlayerUId key).
      2. Collect container GUIDs from player save (OtomoCharacterContainerId, PalStorageContainerId).
      3. Walk CharacterSaveParameterMap: include non-player entries whose
         OwnerPlayerUId matches the player UID, or whose InstanceId is in
         a player container.
    """
    level = raw_json.get("level", {})
    if not isinstance(level, dict):
        return []

    try:
        wsd = level["properties"]["worldSaveData"]["value"]
        pairs = wsd["CharacterSaveParameterMap"]["value"]
    except (KeyError, TypeError):
        return []

    # --- collect player UID from CharacterSaveParameterMap (IsPlayer entry) ---
    player_uids: set[str] = set()
    for pair in pairs:
        try:
            sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
            if sp.get("IsPlayer", {}).get("value") is True:
                uid = pair["key"]["PlayerUId"]["value"]
                if uid and uid != "00000000-0000-0000-0000-000000000000":
                    player_uids.add(uid.lower())
                # Also add InstanceId as fallback owner match
                iid = pair["key"]["InstanceId"]["value"]
                if iid:
                    player_uids.add(iid.lower())
        except (KeyError, TypeError, AttributeError):
            continue

    # --- collect container GUIDs from player saves ---
    container_guids: set[str] = set()
    players = raw_json.get("players", {})
    if isinstance(players, dict):
        for player_data in players.values():
            if not isinstance(player_data, dict) or "_decode_error" in player_data:
                continue
            try:
                sv = player_data["properties"]["SaveData"]["value"]
                for key in ("OtomoCharacterContainerId", "PalStorageContainerId"):
                    guid = sv.get(key, {}).get("value", {}).get("ID", {}).get("value", "")
                    if guid:
                        container_guids.add(guid.lower())
            except (KeyError, TypeError):
                continue

    # --- resolve container slots → instance GUIDs ---
    slot_instance_guids: set[str] = set()
    try:
        cont_pairs = wsd["CharacterContainerSaveData"]["value"]
        for cp in cont_pairs:
            cid = cp["key"]["ID"]["value"]
            if not cid or cid.lower() not in container_guids:
                continue
            slots = cp["value"]["Slots"]["value"]["values"]
            for slot in slots:
                try:
                    inst_id = slot["RawData"]["value"]["instance_id"]
                    if inst_id:
                        slot_instance_guids.add(inst_id.lower())
                except (KeyError, TypeError):
                    continue
    except (KeyError, TypeError):
        pass

    # --- extract pal names ---
    seen: set[str] = set()
    result: list[str] = []

    for pair in pairs:
        try:
            sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
        except (KeyError, TypeError):
            continue

        # skip player entries
        if sp.get("IsPlayer", {}).get("value") is True:
            continue

        inst_id = pair["key"]["InstanceId"]["value"]
        owner_uid = sp.get("OwnerPlayerUId", {}).get("value", "")

        owned = (
            (inst_id and inst_id.lower() in slot_instance_guids)
            or (owner_uid and owner_uid.lower() in player_uids)
        )
        if not owned:
            continue

        char_id = sp.get("CharacterID", {}).get("value", "")
        if char_id and char_id not in seen:
            seen.add(char_id)
            result.append(char_id)

    result.sort(key=str.casefold)
    return result
