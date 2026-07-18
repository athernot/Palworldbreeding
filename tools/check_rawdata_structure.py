"""
Check the actual RawData structure in slots.
"""
import json

# Load Level.json
with open('debug/Level.json', 'r', encoding='utf-8') as f:
    level_data = json.load(f)

wsd = level_data["properties"]["worldSaveData"]["value"]
cont_pairs = wsd["CharacterContainerSaveData"]["value"]

print("Checking RawData structure in first container:")
cp = cont_pairs[0]
slots = cp['value']['Slots']['value']
print(f"Slots value keys: {list(slots.keys())}")

if 'values' in slots:
    slots_values = slots['values']
    print(f"Slots values type: {type(slots_values)}")
    print(f"Slots values length: {len(slots_values)}")
    
    if len(slots_values) > 0:
        first_slot = slots_values[0]
        print(f"\nFirst slot structure:")
        print(json.dumps(first_slot, indent=2))
        
        if 'RawData' in first_slot:
            raw_data = first_slot['RawData']
            print(f"\nRawData structure:")
            print(json.dumps(raw_data, indent=2))
