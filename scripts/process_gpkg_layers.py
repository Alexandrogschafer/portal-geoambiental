"""
Processa os GeoPackage de Autos de Infração e Autorização de Supressão de
Vegetação (data/raw/gpkg/) para GeoJSON em data/processed/, seguindo a
mesma convenção usada em scripts/process_licenciamento.py.

Duas correções de encoding distintas:

1. autoinfrac_a_o_estadoplg.gpkg (polígonos) tem texto já corrompido de
   forma irreversível na origem: os acentos foram substituídos por
   caracteres de substituição Unicode (U+FFFD, "ï¿½" quando lido como
   UTF-8) — os bytes originais não existem mais no arquivo, não tem como
   recuperar por decodificação. Corrigido por substituição literal
   (MANUAL_VALUE_FIXES), com o texto correto conferido cruzando com os
   valores de "categoria" do arquivo irmão autoinfrac_a_o_estadopt.gpkg
   (pontos), que não tem esse problema.

2. autorizac_a_osupressa_oveg_alto.gpkg tem o mesmo mojibake clássico
   (UTF-8 lido como Windows-1252) já visto em nascentes/UCs — ver
   scripts/fix_encoding_mojibake.py. Revertido com
   `.encode('cp1252').decode('utf-8')`, com poucos casos manuais para as
   letras Á/Í maiúsculas cujo segundo byte foi descartado na origem.

Uso: python3 scripts/process_gpkg_layers.py
(depende de ogr2ogr do GDAL, já disponível no sistema)
"""

import json
import re
import subprocess
from pathlib import Path

GPKG_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "gpkg"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"


def load_gpkg_as_geojson(gpkg_name):
    result = subprocess.run(
        ["ogr2ogr", "-f", "GeoJSON", "/vsistdout/", str(GPKG_DIR / gpkg_name)],
        capture_output=True, check=True, text=True,
    )
    return json.loads(result.stdout)


def write_geojson(data, out_name):
    out_path = PROCESSED_DIR / out_name
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"-> {out_name}: {len(data['features'])} features")


# ---------------------------------------------------------------------------
# Autos de Infração
# ---------------------------------------------------------------------------

# autoinfrac_a_o_estadoplg.gpkg: texto irreversível na origem — cada acento
# perdido virou U+FFFD, e o arquivo foi então salvo com esse caractere
# reinterpretado byte a byte como Windows-1252, virando a sequência de 3
# caracteres abaixo (conferida com os codepoints reais do GeoJSON, não por
# inspeção visual — glifos de mojibake não são confiáveis para copiar/colar).
# Corrigido por transcrição literal, com o texto correto conferido cruzando
# com os valores de "categoria" do arquivo irmão autoinfrac_a_o_estadopt.gpkg
# (pontos), que não tem esse problema.
B = "�".encode("utf-8").decode("latin1")  # == 'ï¿½', um acento perdido

MANUAL_VALUE_FIXES = {
    f"Auto de infra{B}{B}o": "Auto de infração",
    f"DESMATAMENTO SEM LICEN{B}A": "DESMATAMENTO SEM LICENÇA",
    f"Desmatamento / Supress{B}o de vegeta{B}{B}o nativa":
        "Desmatamento / Supressão de vegetação nativa",
    f"Explora{B}{B}o de {B}rvores": "Exploração de árvores",
    f"Parcelamento de solo sem licen{B}a.": "Parcelamento de solo sem licença.",
    f"Polui{B}{B}o ou Degrada{B}{B}o Ambiental - Implanta{B}{B}o de loteamento/parcelamento irregular do solo":
        "Poluição ou Degradação Ambiental - Implantação de loteamento/parcelamento irregular do solo",
    f"Polui{B}{B}o ou Degrada{B}{B}o Ambiental - Implanta{B}{B}o e/ou opera{B}{B}o de atividade potencialmente poluidora":
        "Poluição ou Degradação Ambiental - Implantação e/ou operação de atividade potencialmente poluidora",
    f"Por danifica{B}{B}o de vegeta{B}{B}o nativa atrav{B}s do plantio de esp{B}cie ex{B}tica (bambu), sem a devida licen{B}a ambiental competente":
        "Por danificação de vegetação nativa através do plantio de espécie exótica (bambu), sem a devida licença ambiental competente",
    f"Por danifica{B}{B}o de vegeta{B}{B}o nativa atrav{B}s do plantio de esp{B}cie ex{B}tica (eucalipto), sem a devida licen{B}a ambiental competente":
        "Por danificação de vegetação nativa através do plantio de espécie exótica (eucalipto), sem a devida licença ambiental competente",
    f"Por danifica{B}{B}o de vegeta{B}{B}o nativa em APP atrav{B}s do plantio de esp{B}cie ex{B}tica (bambu), sem a devida licen{B}a ambiental competente":
        "Por danificação de vegetação nativa em APP através do plantio de espécie exótica (bambu), sem a devida licença ambiental competente",
    f"Por degrada{B}{B}o de APP sem a devida autoriza{B}{B}o ambiental":
        "Por degradação de APP sem a devida autorização ambiental",
    f"Por degrada{B}{B}o em APP sem a devida autoriza{B}{B}o ambiental":
        "Por degradação em APP sem a devida autorização ambiental",
    f"Por ser part{B}cipe (aquisi{B}{B}o de im{B}vel) de parcelamento de solos com caracter{B}sticas urbana em zona rural sem o devido licenciamento ambiental.":
        "Por ser partícipe (aquisição de imóvel) de parcelamento de solos com características urbana em zona rural sem o devido licenciamento ambiental.",
    f"Por supress{B}o de vegeta{B}{B}o nativa (corta raso) sem autoriza{B}{B}o do {B}rg{B}o ambiental competente.":
        "Por supressão de vegetação nativa (corta raso) sem autorização do órgão ambiental competente.",
    f"Sem licen{B}a": "Sem licença",
    f"Sem licen{B}a.": "Sem licença.",
    f"Supress{B}o em APP.": "Supressão em APP.",
    f"Supress{B}o vegetal sem licen{B}a.": "Supressão vegetal sem licença.",
    f"Vegeta{B}{B}o - Desmatamento / Supress{B}o de vegeta{B}{B}o nativa":
        "Vegetação - Desmatamento / Supressão de vegetação nativa",
    f"Vegeta{B}{B}o - Explora{B}{B}o de {B}rvores": "Vegetação - Exploração de árvores",
    f"Vegeta{B}{B}o - Outro": "Vegetação - Outro",
    f"realizar parcelamento do solo abaixo da FMP sem autoriza{B}{B}o do {B}rg{B}o competente.":
        "realizar parcelamento do solo abaixo da FMP sem autorização do órgão competente.",
    f"supress{B}o de vegeta{B}{B}o nativa sem o devido licenciamento ambiental":
        "supressão de vegetação nativa sem o devido licenciamento ambiental",
}


def fix_manual_value(v):
    if isinstance(v, str) and v in MANUAL_VALUE_FIXES:
        return MANUAL_VALUE_FIXES[v]
    return v


# O campo "autuado" (nome_razao) mistura pessoa física e pessoa jurídica.
# Por decisão de privacidade, só publicamos o nome quando reconhecemos uma
# pessoa jurídica ou órgão público (marcadores abaixo); nome de pessoa
# física é omitido do popup público — só aparecem infração/processo/data.
# Isso também neutraliza um CPF que veio colado a um nome na origem
# ("Mariana Maciel de Alencastro de Lacerda 30989310191"): sem marcador de
# pessoa jurídica, o campo inteiro é omitido.
LEGAL_ENTITY_PATTERN = re.compile(
    r"\b(LTDA|EIRELI|EPP|S/A|S\.A\.?|HOLDING|INSTITUTO|AGENCIA|PREFEITURA|MUNIC[IÍ]PIO)\b|-\s*ME\b",
    re.IGNORECASE,
)


def is_legal_entity(name):
    return bool(name) and bool(LEGAL_ENTITY_PATTERN.search(name))


AUTOS_FIELD_MAP = {
    "data_criac": "data_infracao",
    "codigo_pro": "numero_processo",
    "nome_razao": "autuado",
    "categoria": "descricao",
    "area": "area_ha",
    "status": "status",
}


def clean_autos_properties(props, use_manual_fix):
    cleaned = {}
    for raw_key, clean_key in AUTOS_FIELD_MAP.items():
        value = props.get(raw_key)
        if use_manual_fix:
            value = fix_manual_value(value)
        if clean_key == "data_infracao" and isinstance(value, str):
            value = value.split("T")[0]
        if clean_key == "autuado" and not is_legal_entity(value):
            continue  # pessoa física — nome omitido do popup público
        if value is not None:
            cleaned[clean_key] = value
    return cleaned


def process_autos_infracao():
    for gpkg_name, out_name, use_manual_fix in [
        ("autoinfrac_a_o_estadoplg.gpkg", "autos_infracao_areas.geojson", True),
        ("autoinfrac_a_o_estadopt.gpkg", "autos_infracao_pontos.geojson", False),
    ]:
        raw = load_gpkg_as_geojson(gpkg_name)
        features = [
            {
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": clean_autos_properties(feat["properties"], use_manual_fix),
            }
            for feat in raw["features"]
        ]
        write_geojson({"type": "FeatureCollection", "features": features}, out_name)


# ---------------------------------------------------------------------------
# Autorização de Supressão de Vegetação
# ---------------------------------------------------------------------------

SUPRESSAO_MANUAL_FIXES = {
    "ORDINÃRIA": "ORDINÁRIA",
    "ÃGUA": "ÁGUA",
    "ÃREA": "ÁREA",
    "ÃREAS": "ÁREAS",
}
SUPRESSAO_MANUAL_PATTERN = re.compile("|".join(re.escape(k) for k in SUPRESSAO_MANUAL_FIXES))

SUPRESSAO_FIELD_MAP = {
    "numero_pro": "numero_processo",
    "tipolicenc": "tipo_licenca",
    "feicao": "feicao",
    "descricaoa": "descricao_atividade",
    "datacriaca": "data_criacao",
    "dataemissa": "data_emissao",
    "datavalida": "data_validade",
}


def fix_supressao_text(s):
    if not isinstance(s, str) or "Ã" not in s:
        return s
    parts = []
    last = 0
    for m in SUPRESSAO_MANUAL_PATTERN.finditer(s):
        chunk = s[last:m.start()]
        parts.append(_cp1252_roundtrip(chunk))
        parts.append(SUPRESSAO_MANUAL_FIXES[m.group()])
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


def clean_supressao_properties(props):
    cleaned = {}
    for raw_key, clean_key in SUPRESSAO_FIELD_MAP.items():
        value = props.get(raw_key)
        if isinstance(value, str):
            value = fix_supressao_text(value)
            if clean_key in ("data_criacao", "data_emissao", "data_validade"):
                value = value.split("T")[0]
        if value is not None:
            cleaned[clean_key] = value
    return cleaned


def process_supressao():
    raw = load_gpkg_as_geojson("autorizac_a_osupressa_oveg_alto.gpkg")
    features = [
        {
            "type": "Feature",
            "geometry": feat["geometry"],
            "properties": clean_supressao_properties(feat["properties"]),
        }
        for feat in raw["features"]
    ]
    write_geojson({"type": "FeatureCollection", "features": features}, "supressao_vegetal.geojson")


if __name__ == "__main__":
    process_autos_infracao()
    process_supressao()
