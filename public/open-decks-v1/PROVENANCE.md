# DIVINE archival deck artwork

Every image in this directory is derived from an openly licensed historical
scan hosted by Wikimedia Commons. The per-collection `manifest.json` files
record the exact source page, creator metadata, license statement, local file,
and byte size for every card.

- `oracle/`: Master of the E-Series Mantegna Tarocchi, circa 1465.
- `ritual/`: Cesare Ripa, _Iconologia_, 1613.
- `temple/`: Jean-François Champollion, _Panthéon égyptien_, 1823–1825.
- `zodiac/`: Sidney Hall, _Urania’s Mirror_, 1825.

The build script preserves each source image’s aspect ratio, resizes it only,
and never crops it. DIVINE’s card names and interpretations are original and
are rendered separately by the application.
