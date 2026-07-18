"""
Python adapter entrypoint for the Electron bridge.

Commands (first CLI argument):
  health         Validate runtime dependencies and return structured status.
  decode_save    Decode a Palworld save folder to JSON.
  extract_save   Decode then extract owned pal data.

Read-only — never writes to save files.

DEBUG mode:
  Set DEBUG=1 environment variable to write decoded JSON to debug/ directory
  for inspection. Does not change extraction logic or output schema.
"""

from __future__ import annotations

import json
import os
import sys

# DEBUG mode flag
DEBUG = os.environ.get("DEBUG", "0") == "1"

# ---------- extractor package ----------
from extractor import extract

# ---------- decoder package ----------
from decoder import get_decoder

# ---------- palsav GVAS layer ----------
# Imported at module level so health check can detect missing dependencies.
_IMPORT_ERROR: str = ""
_PYTHON_VERSION_OK: bool = sys.version_info >= (3, 13)

try:
    from palsav.gvas import GvasFile
    from palsav.json_tools import CustomEncoder
    from palsav.paltypes import (
        DISABLED_PROPERTIES,
        PALWORLD_CUSTOM_PROPERTIES,
        PALWORLD_TYPE_HINTS,
    )
    _PALSAV_OK = True
    _PALOOZ_OK = True
except ImportError as _exc:
    _PALSAV_OK = False
    _PALOOZ_OK = False
    _IMPORT_ERROR = str(_exc)
    GvasFile = None  # type: ignore[assignment]
    CustomEncoder = None  # type: ignore[assignment]
    DISABLED_PROPERTIES: frozenset[str] = frozenset()
    PALWORLD_CUSTOM_PROPERTIES: dict = {}
    PALWORLD_TYPE_HINTS: dict = {}
    print(f"DEBUG: Import error: {_IMPORT_ERROR}", file=sys.stderr)

# Distinguish palsav-installed-but-palooz-missing from palsav-not-installed.
if not _PALSAV_OK and "palooz" in _IMPORT_ERROR:
    _PALOOZ_OK = False
    _PALSAV_OK = True  # palsav itself imported far enough to trigger palooz load


def main() -> int:
    args = sys.argv[1:]
    command = args[0] if args else "health"
    print(f"======== Python ======== Command: {command}", file=sys.stderr)

    if command == "extract_save":
        result = handle_extract_save(args[1:])
    elif command == "decode_save":
        result = handle_decode_save(args[1:])
    else:
        result = handle_health()

    json_output = json.dumps(result)
    print(f"======== Python ======== JSON output length: {len(json_output)}", file=sys.stderr)
    print(f"======== Python ======== JSON keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}", file=sys.stderr)
    if isinstance(result, dict) and "success" in result:
        print(f"======== Python ======== success: {result['success']}", file=sys.stderr)
        if result.get("success") and "data" in result:
            print(f"======== Python ======== data keys: {list(result['data'].keys()) if isinstance(result['data'], dict) else 'N/A'}", file=sys.stderr)
    sys.stdout.write(json_output)
    sys.stdout.flush()
    return 0


# -------------------------------------------------- #
#  Health                                            #
# -------------------------------------------------- #

def handle_health() -> dict:
    """
    Validate the full decode stack and return a structured status payload.
    Does NOT decode any save file — import checks only.
    """
    version_str = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    if not _PYTHON_VERSION_OK:
        return {
            "success": False,
            "message": (
                f"Python 3.13 or later is required. "
                f"Current version: {version_str}. "
                "Please install Python 3.13 from python.org."
            ),
            "checks": {
                "python_version": False,
                "palsav": False,
                "palooz": False,
            },
        }

    if not _PALSAV_OK:
        return {
            "success": False,
            "message": (
                "palsav-flex is not installed. "
                "Install it from deafdudecomputers/PalworldSaveTools: "
                "pip install <repo>/src/palsav --no-deps"
            ),
            "checks": {
                "python_version": True,
                "palsav": False,
                "palooz": False,
            },
        }

    if not _PALOOZ_OK:
        return {
            "success": False,
            "message": (
                "palooz binary not found. "
                "Copy palooz.cp313-win_amd64.pyd from the PalworldSaveTools "
                "standalone release into: <site-packages>/palsav/lib/windows/"
            ),
            "checks": {
                "python_version": True,
                "palsav": True,
                "palooz": False,
            },
        }

    return {
        "success": True,
        "message": "Python Bridge Ready",
        "checks": {
            "python_version": True,
            "palsav": True,
            "palooz": True,
        },
    }


# -------------------------------------------------- #
#  decode_save <save_folder_path>                    #
# -------------------------------------------------- #

REQUIRED_FILES = ("Level.sav", "LevelMeta.sav")
REQUIRED_DIRS = ("Players",)


def handle_decode_save(args: list[str]) -> dict:
    if not args:
        return {"success": False, "error": "Missing save folder path argument."}

    save_folder = args[0]

    # ---------- validate folder ----------
    if not os.path.isdir(save_folder):
        return {"success": False, "error": f"Not a directory: {save_folder}"}

    for filename in REQUIRED_FILES:
        if not os.path.isfile(os.path.join(save_folder, filename)):
            return {"success": False, "error": f"Required file not found: {filename}"}

    for dirname in REQUIRED_DIRS:
        if not os.path.isdir(os.path.join(save_folder, dirname)):
            return {"success": False, "error": f"Required directory not found: {dirname}"}

    # ---------- dependency check ----------
    health = handle_health()
    if not health["success"]:
        return {"success": False, "error": health["message"]}

    # ---------- collect player .sav files ----------
    players_dir = os.path.join(save_folder, "Players")
    player_files: list[str] = []
    try:
        for entry in os.listdir(players_dir):
            if entry.lower().endswith(".sav"):
                player_files.append(os.path.join(players_dir, entry))
    except OSError:
        pass

    # ---------- build custom properties ----------
    custom_properties: dict = {
        k: v for k, v in PALWORLD_CUSTOM_PROPERTIES.items()
        if k not in DISABLED_PROPERTIES
    }

    decoder = get_decoder()
    output: dict = {}

    output["level_meta"] = _decode_one(
        os.path.join(save_folder, "LevelMeta.sav"),
        decoder, PALWORLD_TYPE_HINTS, custom_properties,
    )
    output["level"] = _decode_one(
        os.path.join(save_folder, "Level.sav"),
        decoder, PALWORLD_TYPE_HINTS, custom_properties,
    )

    players_output: dict = {}
    for player_path in sorted(player_files):
        players_output[os.path.basename(player_path)] = _decode_one(
            player_path, decoder, PALWORLD_TYPE_HINTS, custom_properties,
        )
    output["players"] = players_output

    # ---------- DEBUG mode: write decoded JSON to debug/ ----------
    if DEBUG:
        _write_debug_json(output)
        _write_debug_summaries(output)

    return {"success": True, "data": output}


def _decode_one(
    filepath: str,
    decoder,
    type_hints: dict,
    custom_properties: dict,
) -> dict:
    """
    Decode a single .sav file to a JSON-safe dict.
    Returns {"_decode_error": "<message>"} on failure instead of raising,
    so one bad file does not abort the entire decode.
    """
    try:
        with open(filepath, "rb") as fh:
            raw_data = fh.read()

        raw_gvas = decoder.decode(raw_data)

        gvas_file = GvasFile.read(raw_gvas, type_hints, custom_properties)
        dumped = gvas_file.dump()
        return json.loads(json.dumps(dumped, cls=CustomEncoder))
    except Exception as exc:
        return {"_decode_error": f"{type(exc).__name__}: {exc}"}


def _write_debug_json(decoded_data: dict) -> None:
    """
    Write decoded JSON to debug/ directory for inspection.
    Creates:
      debug/Level.json
      debug/LevelMeta.json
      debug/Players/<filename>.json
    """
    debug_dir = "debug"
    try:
        os.makedirs(debug_dir, exist_ok=True)
    except OSError:
        return

    # Write Level.json
    if "level" in decoded_data:
        level_path = os.path.join(debug_dir, "Level.json")
        try:
            with open(level_path, "w", encoding="utf-8") as f:
                json.dump(decoded_data["level"], f, indent=2, ensure_ascii=False)
        except OSError:
            pass

    # Write LevelMeta.json
    if "level_meta" in decoded_data:
        level_meta_path = os.path.join(debug_dir, "LevelMeta.json")
        try:
            with open(level_meta_path, "w", encoding="utf-8") as f:
                json.dump(decoded_data["level_meta"], f, indent=2, ensure_ascii=False)
        except OSError:
            pass

    # Write Players/*.json
    if "players" in decoded_data:
        players_dir = os.path.join(debug_dir, "Players")
        try:
            os.makedirs(players_dir, exist_ok=True)
        except OSError:
            pass

        for filename, player_data in decoded_data["players"].items():
            player_path = os.path.join(players_dir, f"{filename}.json")
            try:
                with open(player_path, "w", encoding="utf-8") as f:
                    json.dump(player_data, f, indent=2, ensure_ascii=False)
            except OSError:
                pass


def _write_debug_summaries(decoded_data: dict) -> None:
    """
    Write summary files for decoded JSON to debug/ directory.
    Creates:
      debug/Level.summary.txt
      debug/LevelMeta.summary.txt
      debug/Players/<filename>.summary.txt
    """
    debug_dir = "debug"
    try:
        os.makedirs(debug_dir, exist_ok=True)
    except OSError:
        return

    # Write Level.summary.txt
    if "level" in decoded_data:
        level_summary_path = os.path.join(debug_dir, "Level.summary.txt")
        try:
            with open(level_summary_path, "w", encoding="utf-8") as f:
                f.write(_generate_level_summary(decoded_data["level"]))
        except OSError:
            pass

    # Write LevelMeta.summary.txt
    if "level_meta" in decoded_data:
        level_meta_summary_path = os.path.join(debug_dir, "LevelMeta.summary.txt")
        try:
            with open(level_meta_summary_path, "w", encoding="utf-8") as f:
                f.write(_generate_level_meta_summary(decoded_data["level_meta"]))
        except OSError:
            pass

    # Write Players/*.summary.txt
    if "players" in decoded_data:
        players_dir = os.path.join(debug_dir, "Players")
        try:
            os.makedirs(players_dir, exist_ok=True)
        except OSError:
            pass

        for filename, player_data in decoded_data["players"].items():
            player_summary_path = os.path.join(players_dir, f"{filename}.summary.txt")
            try:
                with open(player_summary_path, "w", encoding="utf-8") as f:
                    f.write(_generate_player_summary(player_data))
            except OSError:
                pass


def _generate_level_summary(level_data: dict) -> str:
    """Generate summary for Level.json."""
    lines = ["Level.json Summary", "=" * 50, ""]

    # Top level keys
    lines.append("Top Level Keys")
    lines.append("-" * 50)
    for key in level_data.keys():
        lines.append(f"  {key}")
    lines.append("")

    # Search for important fields
    important_fields = [
        "WorldName",
        "OwnerPlayerUid",
        "CharacterContainerId",
        "OtomoCharacterContainerId",
        "PalStorageContainerId",
        "CharacterSaveParameterMap",
        "CharacterContainerSaveData",
        "GuildSaveData",
        "BaseCampSaveData",
    ]

    lines.append("Important Fields")
    lines.append("-" * 50)
    for field in important_fields:
        path = _find_field_path(level_data, field)
        if path:
            lines.append(f"  {field}: FOUND")
            lines.append(f"    Path: {path}")
            lines.append("")
        else:
            lines.append(f"  {field}: NOT FOUND")
            lines.append("")

    # Count CharacterSaveParameterMap entries if found
    char_map_path = _find_field_path(level_data, "CharacterSaveParameterMap")
    if char_map_path:
        try:
            parts = char_map_path.split(" → ")
            obj = level_data
            for part in parts:
                if part in obj:
                    obj = obj[part]
                elif isinstance(obj, dict) and "value" in obj and part == "value":
                    obj = obj["value"]
                else:
                    break
            if isinstance(obj, list):
                lines.append(f"CharacterSaveParameterMap count: {len(obj)}")
                lines.append("")
        except Exception:
            pass

    return "\n".join(lines)


def _generate_level_meta_summary(level_meta_data: dict) -> str:
    """Generate summary for LevelMeta.json."""
    lines = ["LevelMeta.json Summary", "=" * 50, ""]

    # Top level keys
    lines.append("Top Level Keys")
    lines.append("-" * 50)
    for key in level_meta_data.keys():
        lines.append(f"  {key}")
    lines.append("")

    # Search for WorldName
    worldname_path = _find_field_path(level_meta_data, "WorldName")
    if worldname_path:
        lines.append("WorldName: FOUND")
        lines.append(f"  Path: {worldname_path}")
        lines.append("")
    else:
        lines.append("WorldName: NOT FOUND")
        lines.append("")

    return "\n".join(lines)


def _generate_player_summary(player_data: dict) -> str:
    """Generate summary for Player.json."""
    lines = ["Player.json Summary", "=" * 50, ""]

    # Top level keys
    lines.append("Top Level Keys")
    lines.append("-" * 50)
    for key in player_data.keys():
        lines.append(f"  {key}")
    lines.append("")

    # Search for important fields
    important_fields = [
        "PlayerUId",
        "InstanceId",
        "OtomoCharacterContainerId",
        "PalStorageContainerId",
        "CharacterContainerId",
    ]

    lines.append("Important Fields")
    lines.append("-" * 50)
    for field in important_fields:
        path = _find_field_path(player_data, field)
        if path:
            lines.append(f"  {field}: FOUND")
            lines.append(f"    Path: {path}")
            lines.append("")
        else:
            lines.append(f"  {field}: NOT FOUND")
            lines.append("")

    return "\n".join(lines)


def _find_field_path(data: dict, field_name: str, current_path: str = "") -> str | None:
    """
    Recursively search for a field name in nested dict/list structure.
    Returns the path as "key1 → key2 → ... → field_name" or None if not found.
    """
    if isinstance(data, dict):
        for key, value in data.items():
            if key == field_name:
                return f"{current_path} → {field_name}" if current_path else field_name
            if isinstance(value, (dict, list)):
                new_path = f"{current_path} → {key}" if current_path else key
                result = _find_field_path(value, field_name, new_path)
                if result:
                    return result
    elif isinstance(data, list):
        for i, item in enumerate(data):
            new_path = f"{current_path} → [{i}]" if current_path else f"[{i}]"
            result = _find_field_path(item, field_name, new_path)
            if result:
                return result
    return None


# -------------------------------------------------- #
#  extract_save <save_folder_path>                   #
# -------------------------------------------------- #

def handle_extract_save(args: list[str]) -> dict:
    """Decode save then run the owned pal extractor."""
    decoded = handle_decode_save(args)
    if not decoded.get("success"):
        return decoded

    try:
        extracted = extract(decoded["data"])
        return {"success": True, "data": extracted}
    except Exception as exc:
        return {"success": False, "error": f"Extraction failed: {exc}"}


if __name__ == "__main__":
    raise SystemExit(main())
