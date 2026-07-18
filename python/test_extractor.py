"""
Unit test for the Owned Pal Extractor.

Tests:
- Duplicate removal
- Alphabetical sorting
- Output schema compliance
- Graceful degradation on missing data
"""

from extractor import extract


def test_basic_extraction():
    """Test basic extraction with all fields present."""
    sample_json = {
        "level_meta": {
            "properties": {
                "WorldName": {"type": "NameProperty", "value": "My Palworld"}
            }
        },
        "level": {
            "properties": {
                "worldSaveData": {
                    "type": "StructProperty",
                    "value": {
                        "CharacterSaveParameterMap": {
                            "type": "MapProperty",
                            "value": [
                                {
                                    "key": "player-guid-1",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": True},
                                                "SaveParameter": {
                                                    "type": "StructProperty",
                                                    "value": {
                                                        "NickName": {"type": "NameProperty", "value": "Atherz"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    "key": "pal-guid-1",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": False},
                                                "CharacterID": {"type": "NameProperty", "value": "Anubis"},
                                                "OwnerPlayerUId": {"type": "StructProperty", "value": {"guid": "player-guid-1"}}
                                            }
                                        }
                                    }
                                },
                                {
                                    "key": "pal-guid-2",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": False},
                                                "CharacterID": {"type": "NameProperty", "value": "Astegon"},
                                                "OwnerPlayerUId": {"type": "StructProperty", "value": {"guid": "player-guid-1"}}
                                            }
                                        }
                                    }
                                },
                                {
                                    "key": "pal-guid-3",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": False},
                                                "CharacterID": {"type": "NameProperty", "value": "Anubis"},  # Duplicate
                                                "OwnerPlayerUId": {"type": "StructProperty", "value": {"guid": "player-guid-1"}}
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        "players": {
            "player-guid-1.sav": {
                "properties": {
                    "NickName": {"type": "NameProperty", "value": "Atherz"},
                    "IndividualId": {"type": "StructProperty", "value": {"guid": "player-guid-1"}},
                    "OtomoCharacterContainerId": {"type": "StructProperty", "value": {"guid": "container-1"}},
                    "PalStorageContainerId": {"type": "StructProperty", "value": {"guid": "container-2"}}
                }
            }
        }
    }

    result = extract(sample_json)

    # Verify schema
    assert "worldName" in result
    assert "characterName" in result
    assert "ownedPals" in result

    # Verify values
    assert result["worldName"] == "My Palworld"
    assert result["characterName"] == "Atherz"
    
    # Verify deduplication and sorting
    assert result["ownedPals"] == ["Anubis", "Astegon"]  # Sorted, duplicate removed
    
    print("[PASS] Basic extraction test passed")


def test_missing_data():
    """Test graceful degradation when data is missing."""
    # Empty JSON
    result = extract({})
    assert result == {
        "worldName": "",
        "characterName": "",
        "ownedPals": []
    }
    print("[PASS] Empty JSON test passed")

    # Missing level_meta
    result = extract({"level": {}, "players": {}})
    assert result["worldName"] == ""
    print("[PASS] Missing level_meta test passed")

    # Missing players
    result = extract({"level_meta": {}, "level": {}})
    assert result["characterName"] == ""
    assert result["ownedPals"] == []
    print("[PASS] Missing players test passed")


def test_sorting():
    """Test that pals are sorted alphabetically."""
    sample_json = {
        "level_meta": {"properties": {}},
        "level": {
            "properties": {
                "worldSaveData": {
                    "type": "StructProperty",
                    "value": {
                        "CharacterSaveParameterMap": {
                            "type": "MapProperty",
                            "value": [
                                {
                                    "key": "player-1",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": True},
                                                "SaveParameter": {
                                                    "type": "StructProperty",
                                                    "value": {
                                                        "NickName": {"type": "NameProperty", "value": "Test"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    "key": "pal-z",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": False},
                                                "CharacterID": {"type": "NameProperty", "value": "Zorah"},
                                                "OwnerPlayerUId": {"type": "StructProperty", "value": {"guid": "player-1"}}
                                            }
                                        }
                                    }
                                },
                                {
                                    "key": "pal-a",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": False},
                                                "CharacterID": {"type": "NameProperty", "value": "Anubis"},
                                                "OwnerPlayerUId": {"type": "StructProperty", "value": {"guid": "player-1"}}
                                            }
                                        }
                                    }
                                },
                                {
                                    "key": "pal-m",
                                    "value": {
                                        "RawData": {
                                            "type": "StructProperty",
                                            "value": {
                                                "IsPlayer": {"type": "BoolProperty", "value": False},
                                                "CharacterID": {"type": "NameProperty", "value": "Mossanda"},
                                                "OwnerPlayerUId": {"type": "StructProperty", "value": {"guid": "player-1"}}
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        "players": {
            "player-1.sav": {
                "properties": {
                    "IndividualId": {"type": "StructProperty", "value": {"guid": "player-1"}}
                }
            }
        }
    }

    result = extract(sample_json)
    assert result["ownedPals"] == ["Anubis", "Mossanda", "Zorah"]
    print("[PASS] Sorting test passed")


if __name__ == "__main__":
    test_basic_extraction()
    test_missing_data()
    test_sorting()
    print("\n[PASS] All tests passed!")