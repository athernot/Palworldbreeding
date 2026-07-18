"""
Decoder factory — returns the active BaseDecoder implementation.

palsav handles both PLZ and PLM formats internally, so no branching
on compression type is required. The factory is kept to preserve
pluggability: future decoder backends slot in here without touching main.py.
"""

from __future__ import annotations

from decoder.base import BaseDecoder
from decoder.palsav_decoder import PalsavDecoder


def get_decoder() -> BaseDecoder:
    """
    Return the active decoder instance.

    Currently always returns PalsavDecoder.
    Future backends (e.g. a different compression library) are added here.
    """
    return PalsavDecoder()
