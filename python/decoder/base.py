"""
Abstract base / protocol for a save-file decompressor.

Every decoder MUST implement decode(raw_bytes: bytes) -> bytes,
which strips the compression wrapper and returns raw GVAS payload.
"""

from abc import ABC, abstractmethod


class BaseDecoder(ABC):
    """Contract for all compression decoders."""

    @abstractmethod
    def decode(self, raw_data: bytes) -> bytes:
        """Decompress *raw_data* and return the inner GVAS payload."""
        ...