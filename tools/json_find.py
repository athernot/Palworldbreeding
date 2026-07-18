"""
JSON field search utility.

Usage:
  python tools/json_find.py <json_file> <field_name>

Example:
  python tools/json_find.py debug/Level.json WorldName
  python tools/json_find.py debug/Level.json OwnerPlayerUid
  python tools/json_find.py debug/Level.json CharacterSaveParameterMap
"""

from __future__ import annotations

import json
import sys


def find_field_path(data: dict, field_name: str, current_path: str = "") -> str | None:
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
                result = find_field_path(value, field_name, new_path)
                if result:
                    return result
    elif isinstance(data, list):
        for i, item in enumerate(data):
            new_path = f"{current_path} → [{i}]" if current_path else f"[{i}]"
            result = find_field_path(item, field_name, new_path)
            if result:
                return result
    return None


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: python json_find.py <json_file> <field_name>")
        print("Example: python json_find.py debug/Level.json WorldName")
        return 1

    json_file = sys.argv[1]
    field_name = sys.argv[2]

    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {json_file}")
        return 1
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {json_file}: {e}")
        return 1

    path = find_field_path(data, field_name)
    if path:
        print("Found")
        print()
        parts = path.split(" → ")
        for part in parts:
            print(f"↓")
            print(part)
        print()
        print(f"Full path: {path}")
        return 0
    else:
        print(f"Field '{field_name}' not found in {json_file}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
