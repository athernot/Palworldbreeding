import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))

from decoder import get_decoder
from palsav.gvas import GvasFile
from palsav.json_tools import CustomEncoder
from palsav.paltypes import DISABLED_PROPERTIES, PALWORLD_CUSTOM_PROPERTIES, PALWORLD_TYPE_HINTS

SAVE = r'C:\Users\Atherz\AppData\Local\Pal\Saved\SaveGames\76561198760388528\7A02C6E04FC4A5D244D96790BB58FE64'
custom_props = {k: v for k, v in PALWORLD_CUSTOM_PROPERTIES.items() if k not in DISABLED_PROPERTIES}
decoder = get_decoder()

def decode_file(path):
    with open(path, 'rb') as f:
        raw = f.read()
    gvas = GvasFile.read(decoder.decode(raw), PALWORLD_TYPE_HINTS, custom_props)
    return json.loads(json.dumps(gvas.dump(), cls=CustomEncoder))

level = decode_file(os.path.join(SAVE, 'Level.sav'))
wsd = level['properties']['worldSaveData']
if isinstance(wsd, dict) and 'value' in wsd:
    wsd = wsd['value']

pairs = wsd['CharacterSaveParameterMap']['value']

# Print CharacterID, IsPlayer, NickName, OwnerPlayerUId for first 5 entries
print("=== SaveParameter fields ===")
for i, pair in enumerate(pairs[:5]):
    inst_id = pair['key']['InstanceId']['value']
    player_uid = pair['key']['PlayerUId']['value']
    sp = pair['value']['RawData']['value']['object']['SaveParameter']['value']
    char_id = sp.get('CharacterID', {}).get('value', 'N/A')
    is_player = sp.get('IsPlayer', {}).get('value', 'N/A') if 'IsPlayer' in sp else 'MISSING'
    nick = sp.get('NickName', {}).get('value', 'N/A') if 'NickName' in sp else 'MISSING'
    owner = sp.get('OwnerPlayerUId', {}).get('value', 'N/A') if 'OwnerPlayerUId' in sp else 'MISSING'
    print(f"[{i}] InstanceId={inst_id}")
    print(f"     PlayerUId={player_uid}")
    print(f"     CharacterID={char_id}")
    print(f"     IsPlayer={is_player}")
    print(f"     NickName={nick}")
    print(f"     OwnerPlayerUId={owner}")

# Find a player entry (NickName present)
print("\n=== First entry with NickName ===")
for pair in pairs:
    sp = pair['value']['RawData']['value']['object']['SaveParameter']['value']
    if 'NickName' in sp:
        print("InstanceId:", pair['key']['InstanceId']['value'])
        print("PlayerUId:", pair['key']['PlayerUId']['value'])
        print("NickName:", sp['NickName']['value'])
        print("IsPlayer:", sp.get('IsPlayer', {}).get('value'))
        break

# Container slots
print("\n=== Container slot[0] full structure ===")
cont_pairs = wsd['CharacterContainerSaveData']['value']
cp = cont_pairs[0]
print("Container ID:", cp['key']['ID']['value'])
slots = cp['value']['Slots']['value']
print(f"Slots: {len(slots)}")
if slots:
    s = slots[0]
    print(json.dumps(s, indent=2)[:800])
