# Traditional deck artwork provenance

This directory contains locally cached WebP derivatives of reusable online archive material. The app never depends on a third-party image host at runtime. Every collection has a machine-readable `manifest.json` with one record per card, including the exact source page, creator or collection, license, file size, and image treatment.

## Collections

- **Kipper (36):** cards 1–34 are cropped from the Museumsstiftung Post und Telekommunikation photograph of *Karten der berühmten Wahrsagerin Frau Kipper* (Matthias Seidlein, 1900–1920), licensed CC BY-SA 4.0. The photograph does not show cards 35–36 face-up, so those two cards use explicitly identified public-domain nineteenth-century landscape works. They are substitutes, not claimed originals.
- **Oracle Belline (53):** cropped from the complete historical-design sheet `Oracle-belline-cartes.jpg`, published by its rightsholder under CC BY 4.0.
- **Playing-card cartomancy (52):** Austin Gabriel's complete French-suited deck, released under CC0.
- **Sibilla (52):** corresponding suit-and-rank cards from a nineteenth-century Sibilla-family pack held by the British Museum and marked public domain. Its historical French captions are a documented variant; DIVINE renders the Vera Sibilla Italiana titles separately.
- **Runic cards (24):** public-domain standardized Elder Futhark letterforms. The app explicitly describes the cards and their readings as a modern reflective presentation rather than an ancient divination deck.
- **I Ching cards (64):** public-domain hexagram forms in the King Wen sequence. The card format is a modern interface and does not replace a traditional changing-line consultation.
- **Fal-e Hafez cards (36):** uncropped public-domain or CC0 pages from historical *Divān of Hafez* manuscripts in the Walters Art Museum. Traditional Fāl-e Hāfez is bibliomancy, so the app labels these as contemporary motif cards rather than a historical deck.
- **Hanafuda (48):** cropped from a public-domain early-Shōwa Hachihachi deck scan (1926–1945), arranged by its traditional twelve months and four cards per month.
- **Zigeunerkarten (36):** the traditional German-titled subjects are each paired with a distinct reusable historical work from Wikimedia Commons. This is a modern historical-art edition, not a facsimile of a commercial pack; every individual license and source page is recorded in the manifest.
- **ʿIlm al-raml (16):** the complete sixteen geomantic figures are placed over distinct Public Domain Mark images from Wellcome Collection MS Arabic 664, an Arabic treatise on ʿilm al-raml. The fixed deck is explicitly identified as a modern interface adaptation rather than a replacement for a generated geomantic tableau.

## Source collections

- Kipper: <https://onlinesammlung.museumsstiftung.de/detail/collection/30221e8f-182a-4e3b-9e22-883f6894bff7>
- Belline: <https://commons.wikimedia.org/wiki/File:Oracle-belline-cartes.jpg>
- Playing cards: <https://commons.wikimedia.org/wiki/Category:Public_domain_playing_cards>
- Sibilla: <https://commons.wikimedia.org/wiki/Category:Sibilla_cards>
- Elder Futhark: <https://commons.wikimedia.org/wiki/Category:Elder_Futhark>
- I Ching: <https://commons.wikimedia.org/wiki/Category:I_Ching_hexagrams>
- Hafez: <https://commons.wikimedia.org/wiki/Category:Divan_of_Hafez>
- Hanafuda: <https://commons.wikimedia.org/wiki/File:%E7%99%BD%E7%BE%8E%E4%BA%BA%E5%8D%B0%E3%81%AE%E5%85%AB%E5%85%AB%E8%8A%B1%E6%9C%AD%EF%BC%88%E6%98%AD%E5%92%8C%E5%89%8D%E6%9C%9F%EF%BC%89.jpg>
- Zigeunerkarten historical art: <https://commons.wikimedia.org/>
- ʿIlm al-raml manuscript: <https://wellcomecollection.org/works/agpcdkbz>

The deterministic import and conversion processes live in `scripts/fetch-traditional-deck-art.mjs` and `scripts/fetch-zigeuner-raml-art.mjs`.
