"""
Corrige mojibake nos atributos de texto de data/processed/nascentes.geojson
e data/processed/unidades_conservacao.geojson.

Causa raiz: os GeoJSON de origem (data/raw/nascentes_alto.geojson e
data/raw/uc_*.geojson) foram gerados a partir de um DBF cujo texto UTF-8
foi lido como Windows-1252 e regravado — o clássico "Ã©" no lugar de "é".
Isso é revertido com `.encode('cp1252').decode('utf-8')`.

Duas letras maiúsculas acentuadas (Á, Í) caem em bytes indefinidos em
cp1252 (0x81, 0x8D) e o segundo byte é descartado na origem — não dá pra
recuperá-las genericamente. Como o vocabulário do dataset é conhecido
(topônimos e termos do licenciamento/UC de Alto Paraíso de Goiás), esses
casos são corrigidos por substituição literal (MANUAL_FIXES) antes do
fix genérico ser aplicado ao restante da string.

Também remove um caractere de controle solto (soft hyphen, U+00AD) que
sobrou em data/processed/limite_municipal.geojson por um problema
semelhante, sem impacto visual mas que deixa o texto tecnicamente sujo.

Uso: python3 scripts/fix_encoding_mojibake.py
"""

import json
import re
from pathlib import Path

PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"

MANUAL_FIXES = {
    "PARAÃSO": "PARAÍSO",
    "GOIÃS": "GOIÁS",
    "SUSTENTÃVEL": "SUSTENTÁVEL",
    "HÃDRICOS": "HÍDRICOS",
    "ÃREA": "ÁREA",
    "Ãrea": "Área",
}
MANUAL_PATTERN = re.compile("|".join(re.escape(k) for k in MANUAL_FIXES))


def fix_text(s):
    if not isinstance(s, str) or "Ã" not in s:
        return s

    parts = []
    last = 0
    for m in MANUAL_PATTERN.finditer(s):
        chunk = s[last:m.start()]
        parts.append(_cp1252_roundtrip(chunk))
        parts.append(MANUAL_FIXES[m.group()])
        last = m.end()
    parts.append(_cp1252_roundtrip(s[last:]))
    return "".join(parts)


def _cp1252_roundtrip(chunk):
    if not chunk:
        return chunk
    try:
        return chunk.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        print(f"  [aviso] trecho não recuperável automaticamente: {chunk!r}")
        return chunk


def fix_geojson_text(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    changed = 0
    for feat in data["features"]:
        for key, value in feat["properties"].items():
            fixed = fix_text(value)
            if fixed != value:
                feat["properties"][key] = fixed
                changed += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    print(f"{path.name}: {changed} valores corrigidos")


def strip_stray_soft_hyphen(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    changed = 0
    for feat in data["features"]:
        for key, value in feat["properties"].items():
            if isinstance(value, str) and "\xad" in value:
                feat["properties"][key] = value.replace("\xad", "")
                changed += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    print(f"{path.name}: {changed} valores com soft-hyphen solto removidos")


if __name__ == "__main__":
    fix_geojson_text(PROCESSED_DIR / "nascentes.geojson")
    fix_geojson_text(PROCESSED_DIR / "unidades_conservacao.geojson")
    strip_stray_soft_hyphen(PROCESSED_DIR / "limite_municipal.geojson")
