"""
Verify if container IDs from Player.sav are needed for Party/Palbox classification.
"""
import json

# Load Player.sav data
with open('debug/Players/00000000000000000000000000000001.sav.json', 'r', encoding='utf-8') as f:
    player_data = json.load(f)

player_container_data = player_data['properties']['SaveData']['value']

# Extract container IDs from Player.sav
party_container_id = player_container_data.get('OtomoCharacterContainerId', {}).get('value', {}).get('ID', {}).get('value')
palbox_container_id = player_container_data.get('PalStorageContainerId', {}).get('value', {}).get('ID', {}).get('value')

print("Player.sav container IDs:")
print(f"Party (OtomoCharacterContainerId): {party_container_id}")
print(f"Palbox (PalStorageContainerId): {palbox_container_id}")

# Load Level.sav data
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

char_map = level_data['properties']['worldSaveData']['value']['CharacterSaveParameterMap']['value']

player_uid = "00000000-0000-0000-0000-000000000001"
player_entries = [e for e in char_map if e['key']['PlayerUId']['value'] == player_uid]

print(f"\nAnalyzing {len(player_entries)} entries for player {player_uid}")

# Classify entries by container
party_count = 0
palbox_count = 0
other_count = 0

for entry in player_entries:
    save_param = entry['value']['RawData']['value']['object']['SaveParameter']['value']
    if 'SlotId' in save_param:
        slot_id = save_param['SlotId']['value']
        container_id = slot_id.get('ContainerId', {}).get('value', {}).get('ID', {}).get('value')
        
        if container_id == party_container_id:
            party_count += 1
        elif container_id == palbox_container_id:
            palbox_count += 1
        else:
            other_count += 1

print(f"\nClassification using Player.sav container IDs:")
print(f"Party: {party_count}")
print(f"Palbox: {palbox_count}")
print(f"Other (Base/Unknown): {other_count}")

# Check if we can determine these container IDs from Level.sav alone
print(f"\nCRITICAL QUESTION: Can we determine Party/Palbox container IDs from Level.sav alone?")
print(f"ANSWER: Need to search Level.sav for these container IDs...")

# Search for the container IDs in Level.sav
party_found = False
palbox_found = False

# Check in CharacterContainerSaveData
char_container_data = level_data['properties']['worldSaveData']['value']['CharacterContainerSaveData']['value']
print(f"\nCharacterContainerSaveData entries: {len(char_container_data)}")

for container in char_container_data:
    if 'ID' in container:
        container_guid = container['ID']['value']['ID']['value']
        if container_guid == party_container_id:
            party_found = True
            print(f"Found Party container ID in CharacterContainerSaveData: {container_guid}")
        if container_guid == palbox_container_id:
            palbox_found = True
            print(f"Found Palbox container ID in CharacterContainerSaveData: {container_guid}")

print(f"\nParty container found in Level.sav: {party_found}")
print(f"Palbox container found in Level.sav: {palbox_found}")

if party_found and palbox_found:
    print("\nCONCLUSION: Player.sav may NOT be needed for container classification")
else:
    print("\nCONCLUSION: Player.sav IS needed to identify Party/Palbox container IDs")
