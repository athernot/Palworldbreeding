"""
Extractor integrity audit - analyze extraction results without modifying code.
"""
import json

# Load Level.json
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

# Load Player.json
with open('debug/Players/00000000000000000000000000000001.sav.json', 'r', encoding='utf-8') as f:
    player_data = json.load(f)

print("=" * 60)
print("EXTRACTOR INTEGRITY AUDIT")
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

print(f"   Player UIDs collected: {len(player_uids)}")

# Resolve container slots → instance GUIDs
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

# Analyze all entries
ignored_player = 0
ignored_npc = 0
ignored_boss = 0
ignored_invalid_charid = 0
ignored_egg = 0
ignored_not_owned = 0
owned_individual = []
party_pals = []
palbox_pals = []
base_pals = []

for pair in char_map:
    try:
        sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
    except (KeyError, TypeError):
        continue

    # Check if player
    if sp.get("IsPlayer", {}).get("value") is True:
        ignored_player += 1
        continue

    inst_id = pair["key"]["InstanceId"]["value"]
    owner_uid = sp.get("OwnerPlayerUId", {}).get("value", "")
    char_id = sp.get("CharacterID", {}).get("value", "")

    # Check ownership
    owned = (inst_id and inst_id.lower() in slot_instance_guids) or (owner_uid and owner_uid.lower() in player_uids)

    if not owned:
        ignored_not_owned += 1
        continue

    # Check for invalid CharacterID
    if not char_id or char_id == "" or char_id.startswith("None"):
        ignored_invalid_charid += 1
        continue

    # Check for boss
    if char_id.startswith("BOSS_"):
        ignored_boss += 1
        continue

    # Check for egg (common egg patterns)
    if "Egg" in char_id or char_id.startswith("Egg"):
        ignored_egg += 1
        continue

    # Determine location
    if inst_id and inst_id.lower() in slot_instance_guids:
        # Find which container
        try:
            cont_pairs = wsd["CharacterContainerSaveData"]["value"]
            for cp in cont_pairs:
                cid = cp["key"]["ID"]["value"]
                if cid.lower() not in container_guids:
                    continue
                slots = cp["value"]["Slots"]["value"]["values"]
                for slot in slots:
                    try:
                        slot_inst_id = slot["RawData"]["value"]["instance_id"]
                        if slot_inst_id and slot_inst_id.lower() == inst_id.lower():
                            if cid.lower() == party_container_id.lower():
                                party_pals.append(char_id)
                            elif cid.lower() == palbox_container_id.lower():
                                palbox_pals.append(char_id)
                            else:
                                base_pals.append(char_id)
                            break
                    except (KeyError, TypeError):
                        continue
        except (KeyError, TypeError):
            pass

    owned_individual.append(char_id)

print(f"\n2. Owned individual pals (before deduplication): {len(owned_individual)}")
print(f"3. Unique species (after deduplication): {len(set(owned_individual))}")
print(f"4. Party pals: {len(party_pals)}")
print(f"5. Palbox pals: {len(palbox_pals)}")
print(f"6. Base pals: {len(base_pals)}")

print(f"\n7. Ignored entries breakdown:")
print(f"   Player entries: {ignored_player}")
print(f"   Not owned (no ownership match): {ignored_not_owned}")
print(f"   Boss pals (BOSS_ prefix): {ignored_boss}")
print(f"   Invalid CharacterID (empty/None): {ignored_invalid_charid}")
print(f"   Egg entries: {ignored_egg}")

# Verify total
total_accounted = ignored_player + ignored_not_owned + ignored_boss + ignored_invalid_charid + ignored_egg + len(owned_individual)
print(f"\nTotal entries accounted for: {total_accounted}")
print(f"Total entries in CharacterSaveParameterMap: {len(char_map)}")
print(f"Match: {total_accounted == len(char_map)}")

# Show sample of ignored not-owned
print(f"\nSample of 'not owned' entries (first 5):")
count = 0
for pair in char_map:
    if count >= 5:
        break
    try:
        sp = pair["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
        if sp.get("IsPlayer", {}).get("value") is True:
            continue
        inst_id = pair["key"]["InstanceId"]["value"]
        owner_uid = sp.get("OwnerPlayerUId", {}).get("value", "")
        owned = (inst_id and inst_id.lower() in slot_instance_guids) or (owner_uid and owner_uid.lower() in player_uids)
        if not owned:
            char_id = sp.get("CharacterID", {}).get("value", "")
            print(f"   CharacterID: {char_id}, OwnerPlayerUId: {owner_uid}, InstanceId: {inst_id}")
            count += 1
    except (KeyError, TypeError):
        continue

print("\n" + "=" * 60)
