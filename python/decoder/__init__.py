"""
Compression decoder package.

Public API:
    get_decoder() -> BaseDecoder

Returns a decoder that decompresses a raw .sav file to GVAS bytes.
Currently backed by PalsavDecoder (palsav + palooz).
"""

from decoder.factory import get_decoder
from decoder.base import BaseDecoder

__all__ = [
    "get_decoder",
    "BaseDecoder",
]
