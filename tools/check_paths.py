"""
Check specific JSON paths from extractor against actual decoded JSON.
"""
import json

# Load Level.json
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

# Load LevelMeta.json
with open('debug/LevelMeta.json', 'r', encoding='utf-8') as f:
    level_meta_data = json.load(f)

# Load Player.json
with open('debug/Players/00000000000000000000000000000001.sav.json', 'r', encoding='utf-8') as f:
    player_data = json.load(f)

print("=" * 60)
print("PATH COMPATIBILITY CHECK")
print("=" * 60)

# world.py path
print("\n1. world.py - extract_world_name")
print("   Expected: level_meta['properties']['SaveData']['value']['WorldName']['value']")
try:
    result = level_meta_data["properties"]["SaveData"]["value"]["WorldName"]["value"]
    print(f"   Actual: FOUND = '{result}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

# character.py paths
print("\n2. character.py - extract_character_name")
print("   Expected: level['properties']['worldSaveData']['value']")
try:
    wsd = level_data["properties"]["worldSaveData"]["value"]
    print(f"   Actual: FOUND")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: wsd['CharacterSaveParameterMap']['value']")
try:
    pairs = wsd["CharacterSaveParameterMap"]["value"]
    print(f"   Actual: FOUND (length: {len(pairs)})")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: pair['value']['RawData']['value']['object']['SaveParameter']['value']")
try:
    sp = pairs[0]["value"]["RawData"]["value"]["object"]["SaveParameter"]["value"]
    print(f"   Actual: FOUND")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: sp.get('IsPlayer', {}).get('value')")
try:
    is_player = sp.get("IsPlayer", {}).get("value")
    print(f"   Actual: FOUND = {is_player}")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: sp.get('NickName', {}).get('value', '')")
try:
    nickname = sp.get("NickName", {}).get("value", "")
    print(f"   Actual: FOUND = '{nickname}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

# owned_pals.py paths
print("\n3. owned_pals.py - extract_owned_pals")
print("   Expected: pair['key']['PlayerUId']['value']")
try:
    uid = pairs[0]["key"]["PlayerUId"]["value"]
    print(f"   Actual: FOUND = '{uid}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: pair['key']['InstanceId']['value']")
try:
    iid = pairs[0]["key"]["InstanceId"]["value"]
    print(f"   Actual: FOUND = '{iid}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: player_data['properties']['SaveData']['value']")
try:
    sv = player_data["properties"]["SaveData"]["value"]
    print(f"   Actual: FOUND")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: sv.get('OtomoCharacterContainerId', {}).get('value', {}).get('ID', {}).get('value', '')")
try:
    guid = sv.get("OtomoCharacterContainerId", {}).get("value", {}).get("ID", {}).get("value", "")
    print(f"   Actual: FOUND = '{guid}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: wsd['CharacterContainerSaveData']['value']")
try:
    cont_pairs = wsd["CharacterContainerSaveData"]["value"]
    print(f"   Actual: FOUND (length: {len(cont_pairs)})")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: cp['key']['ID']['value']")
try:
    cid = cont_pairs[0]["key"]["ID"]["value"]
    print(f"   Actual: FOUND = '{cid}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: cp['value']['Slots']['value']")
try:
    slots = cont_pairs[0]["value"]["Slots"]["value"]
    print(f"   Actual: FOUND (length: {len(slots)})")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: slot['value']['RawData']['value']['instance_id']['value']")
try:
    inst_id = slots[0]["value"]["RawData"]["value"]["instance_id"]["value"]
    print(f"   Actual: FOUND = '{inst_id}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: sp.get('OwnerPlayerUId', {}).get('value', '')")
try:
    owner_uid = sp.get("OwnerPlayerUId", {}).get("value", "")
    print(f"   Actual: FOUND = '{owner_uid}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("   Expected: sp.get('CharacterID', {}).get('value', '')")
try:
    char_id = sp.get("CharacterID", {}).get("value", "")
    print(f"   Actual: FOUND = '{char_id}'")
    print("   Compatible: YES")
except Exception as e:
    print(f"   Actual: ERROR - {e}")
    print("   Compatible: NO")

print("\n" + "=" * 60)
