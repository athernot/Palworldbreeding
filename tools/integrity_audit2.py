"""
Extractor integrity audit - replicate exact extractor logic.
"""
import json

# Load Level.json
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

# Load Player.json
with open('debug/Players/00000000000000000000000000000001.sav.json', 'r', encoding='utf-8') as f:
    player_data = json.load(f)

print("=" * 60)
print("EXTRACTOR INTEGRITY AUDIT (Exact Logic Replication)")
print("=" * 60)

# 1. Total CharacterSaveParameterMap entries
wsd = level_data["properties"]["worldSaveData"]["value"]
char_map = wsd["CharacterSaveParameterMap"]["value"]
print(f"\n1. Total CharacterSaveParameterMap entries: {len(char_map)}")

# Get player container IDs
player_container_data = player_data["properties"]["SaveData"]["value"]
party_container_id = player_container_data.get("OtomoCharacterContainerId", {}).get("value", {}).get("ID", {}).get("value")
palbox_container_id = player_container_data.get("PalStorageContainerId", {}).get("value", {}).get("ID", {}).get("value")

print(f"   Party container ID: {party_container_id}")
print(f"   Palbox container ID: {palbox_container_id}")

# Collect player UIDs (exact extractor logic)
player_uids = set()
for pair in char_map:
    try:
        sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
        if sp.get("IsPlayer", {}).get("value") is True:
            uid = pair["key"]["PlayerUId"]["value"]
            if uid and uid != "00000000-0000-0000-0000-000000000000":
                player_uids.add(uid.lower())
            iid = pair["key"]["InstanceId"]["value"]
            if iid:
                player_uids.add(iid.lower())
    except (KeyError, TypeError):
        continue

print(f"   Player UIDs collected: {len(player_uids)}")

# Resolve container slots → instance GUIDs (exact extractor logic)
container_guids = {party_container_id.lower(), palbox_container_id.lower()}
slot_instance_guids = set()

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

print(f"   Container slot instance GUIDs resolved: {len(slot_instance_guids)}")

# Exact extractor logic for owned pals
seen = set()
result = []
ignored_player = 0
ignored_invalid_charid = 0
ignored_not_owned = 0

for pair in char_map:
    try:
        sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
    except (KeyError, TypeError):
        continue

    # Skip player entries (exact extractor logic)
    if sp.get("IsPlayer", {}).get("value") is True:
        ignored_player += 1
        continue

    inst_id = pair["key"]["InstanceId"]["value"]
    owner_uid = sp.get("OwnerPlayerUId", {}).get("value", "")

    # Check ownership (exact extractor logic)
    owned = (inst_id and inst_id.lower() in slot_instance_guids) or (owner_uid and owner_uid.lower() in player_uids)

    if not owned:
        ignored_not_owned += 1
        continue

    char_id = sp.get("CharacterID", {}).get("value", "")
    
    # Exact extractor logic: only check if char_id exists and not in seen
    if char_id and char_id not in seen:
        seen.add(char_id)
        result.append(char_id)
    elif not char_id:
        ignored_invalid_charid += 1

result.sort(key=str.casefold)

print(f"\n2. Owned individual pals (before deduplication): {len(result) + (len(seen) - len(result))}")
print(f"3. Unique species (after deduplication): {len(result)}")
print(f"   Actual extractor returned: 176")
print(f"   Match: {len(result) == 176}")

print(f"\n4. Ignored entries breakdown:")
print(f"   Player entries: {ignored_player}")
print(f"   Not owned (no ownership match): {ignored_not_owned}")
print(f"   Invalid CharacterID (empty): {ignored_invalid_charid}")

# Verify total
total_accounted = ignored_player + ignored_not_owned + ignored_invalid_charid + len(result)
print(f"\nTotal entries accounted for: {total_accounted}")
print(f"Total entries in CharacterSaveParameterMap: {len(char_map)}")
print(f"Match: {total_accounted == len(char_map)}")

# Show boss pals that are included
boss_pals = [r for r in result if r.startswith("BOSS_")]
print(f"\nBoss pals included in results: {len(boss_pals)}")
print(f"Sample boss pals: {boss_pals[:5]}")

print("\n" + "=" * 60)
