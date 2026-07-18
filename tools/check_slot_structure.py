"""
Check the actual structure of slot data in CharacterContainerSaveData.
"""
import json

# Load Level.json
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

wsd = level_data["properties"]["worldSaveData"]["value"]
cont_pairs = wsd["CharacterContainerSaveData"]["value"]

print("CharacterContainerSaveData structure:")
print(f"Total containers: {len(cont_pairs)}")

for i, cp in enumerate(cont_pairs):
    print(f"\nContainer {i}:")
    print(f"  ID: {cp['key']['ID']['value']}")
    print(f"  Value keys: {list(cp['value'].keys())}")
    
    if 'Slots' in cp['value']:
        slots = cp['value']['Slots']['value']
        print(f"  Slots count: {len(slots)}")
        
        if len(slots) > 0:
            print(f"  First slot keys: {list(slots[0].keys())}")
            print(f"  First slot structure:")
            print(f"    {json.dumps(slots[0], indent=4)}")
