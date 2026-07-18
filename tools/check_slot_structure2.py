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
        slots = cp['value']['Slots']
        print(f"  Slots type: {type(slots)}")
        print(f"  Slots keys: {list(slots.keys()) if isinstance(slots, dict) else 'N/A'}")
        print(f"  Slots value type: {type(slots.get('value')) if isinstance(slots, dict) else 'N/A'}")
        
        if isinstance(slots, dict) and 'value' in slots:
            slots_value = slots['value']
            print(f"  Slots value type: {type(slots_value)}")
            
            if isinstance(slots_value, dict):
                print(f"  Slots value keys: {list(slots_value.keys())}")
                # Show first few entries
                for key in list(slots_value.keys())[:3]:
                    print(f"    Slot {key}: {json.dumps(slots_value[key], indent=2)[:200]}")
            elif isinstance(slots_value, list):
                print(f"  Slots value length: {len(slots_value)}")
                if len(slots_value) > 0:
                    print(f"  First slot: {json.dumps(slots_value[0], indent=2)[:300]}")
