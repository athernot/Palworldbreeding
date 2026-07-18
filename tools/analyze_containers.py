"""
Analyze container IDs from Player.sav and Level.sav to verify dependency.
"""
import json

# Load Player.sav data
with open('debug/Players/00000000000000000000000000000001.sav.json', 'r', encoding='utf-8') as f:
    player_data = json.load(f)

player_container_data = player_data['properties']['SaveData']['value']

print("Player.sav container IDs:")
print(f"PlayerUId: {player_container_data.get('PlayerUId', {}).get('value')}")
print(f"InstanceId: {player_container_data.get('IndividualId', {}).get('value', {}).get('InstanceId', {}).get('value')}")
print(f"OtomoCharacterContainerId: {player_container_data.get('OtomoCharacterContainerId', {}).get('value')}")
print(f"PalStorageContainerId: {player_container_data.get('PalStorageContainerId', {}).get('value')}")

# Load Level.sav data
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

char_map = level_data['properties']['worldSaveData']['value']['CharacterSaveParameterMap']['value']

print(f"\nLevel.sav CharacterSaveParameterMap total entries: {len(char_map)}")

# Find entries for this player
player_uid = "00000000-0000-0000-0000-000000000001"
player_entries = [e for e in char_map if e['key']['PlayerUId']['value'] == player_uid]

print(f"Entries for player {player_uid}: {len(player_entries)}")

# Check if we can reconstruct ownership without Player.sav
print("\nCan we determine ownership from Level.sav alone?")
print(f"YES - Each entry has PlayerUId in the key structure")

# Check container IDs in Level.sav
print("\nChecking for container IDs in Level.sav entries...")
sample_entry = player_entries[0]
save_param = sample_entry['value']['RawData']['value']['object']['SaveParameter']['value']
print(f"Sample entry has SlotId: {'SlotId' in save_param}")
if 'SlotId' in save_param:
    slot_id = save_param['SlotId']['value']
    print(f"Sample SlotId: {slot_id}")
    if 'value' in slot_id:
        print(f"Sample ContainerId: {slot_id['value'].get('ContainerId', {}).get('value')}")
