"""
PalsavDecoder — BaseDecoder implementation backed by palsav + palooz.

Handles both PLZ (zlib) and PLM (Oodle Mermaid) save formats.
palsav detects the format internally; no external DLL is required.

Requires:
    palsav-flex >= 0.2.0  (deafdudecomputers/PalworldSaveTools)
    palooz.cp313-win_amd64.pyd  (pre-built binary in palsav/lib/windows/)
    Python 3.13 (ABI match for the palooz binary)
"""

from __future__ import annotations

from decoder.base import BaseDecoder


class PalsavDecoder(BaseDecoder):
    """Decompressor for PLZ and PLM saves via palsav + palooz."""

    def decode(self, raw_data: bytes) -> bytes:
        """
        Decompress *raw_data* and return the raw GVAS payload.

        palsav.core.decompress_sav_to_gvas detects PLZ vs PLM automatically.
        save_type is discarded — this application is read-only.

        Raises ImportError  if palsav or palooz is not available.
        Raises ValueError   if the save format is unrecognised.
        Raises RuntimeError if decompression fails.
        """
        from palsav.core import decompress_sav_to_gvas  # deferred — validated at startup

        raw_gvas, _save_type = decompress_sav_to_gvas(raw_data)
        return raw_gvas
