"""
Extractor integrity audit - find missing entries.
"""
import json

# Load Level.json
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

# Load Player.json
with open('debug/Players/00000000000000000000000000000001.sav.json', 'r', encoding='utf-8') as f:
    player_data = json.load(f)

print("=" * 60)
print("EXTRACTOR INTEGRITY AUDIT (Missing Entry Investigation)")
print("=" * 60)

# 1. Total CharacterSaveParameterMap entries
wsd = level_data["properties"]["worldSaveData"]["value"]
char_map = wsd["CharacterSaveParameterMap"]["value"]
print(f"\n1. Total CharacterSaveParameterMap entries: {len(char_map)}")

# Get player container IDs
player_container_data = player_data["properties"]["SaveData"]["value"]
party_container_id = player_container_data.get("OtomoCharacterContainerId", {}).get("value", {}).get("ID", {}).get("value")
palbox_container_id = player_container_data.get("PalStorageContainerId", {}).get("value", {}).get("ID", {}).get("value")

# Collect player UIDs
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

# Collect container GUIDs
container_guids = set()
players = {"player": player_data}
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

# Resolve container slots → instance GUIDs
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

# Complete accounting with error tracking
structure_error_rawdata = 0
structure_error_saveparam = 0
ignored_player = 0
ignored_not_owned = 0
owned_pals = []

for i, pair in enumerate(char_map):
    try:
        raw_data = pair["value"]["RawData"]
    except (KeyError, TypeError):
        structure_error_rawdata += 1
        if structure_error_rawdata <= 5:
            print(f"   Entry {i}: Missing RawData - keys: {list(pair.keys())}")
        continue
    
    try:
        value = raw_data["value"]
    except (KeyError, TypeError):
        structure_error_rawdata += 1
        if structure_error_rawdata <= 5:
            print(f"   Entry {i}: Missing RawData.value - keys: {list(raw_data.keys())}")
        continue
    
    try:
        obj = value["object"]
    except (KeyError, TypeError):
        structure_error_rawdata += 1
        if structure_error_rawdata <= 5:
            print(f"   Entry {i}: Missing RawData.value.object - keys: {list(value.keys())}")
        continue
    
    try:
        sp = obj["SaveParameter"]["value"]
    except (KeyError, TypeError):
        structure_error_saveparam += 1
        if structure_error_saveparam <= 5:
            print(f"   Entry {i}: Missing SaveParameter - keys: {list(obj.keys())}")
        continue

    # Skip player entries
    if sp.get("IsPlayer", {}).get("value") is True:
        ignored_player += 1
        continue

    inst_id = pair["key"]["InstanceId"]["value"]
    owner_uid = sp.get("OwnerPlayerUId", {}).get("value", "")

    # Check ownership
    owned = (inst_id and inst_id.lower() in slot_instance_guids) or (owner_uid and owner_uid.lower() in player_uids)

    if not owned:
        ignored_not_owned += 1
        continue

    char_id = sp.get("CharacterID", {}).get("value", "")
    if char_id:
        owned_pals.append(char_id)

print(f"\n2. Structure errors:")
print(f"   Cannot access RawData: {structure_error_rawdata}")
print(f"   Cannot access SaveParameter: {structure_error_saveparam}")

print(f"\n3. Ignored entries:")
print(f"   Player entries: {ignored_player}")
print(f"   Not owned: {ignored_not_owned}")

print(f"\n4. Owned pals: {len(owned_pals)}")

total_accounted = structure_error_rawdata + structure_error_saveparam + ignored_player + ignored_not_owned + len(owned_pals)
print(f"\nTotal accounted: {total_accounted}")
print(f"Total entries: {len(char_map)}")
print(f"Match: {total_accounted == len(char_map)}")

if total_accounted != len(char_map):
    print(f"\nMISSING: {len(char_map) - total_accounted} entries")

print("\n" + "=" * 60)
