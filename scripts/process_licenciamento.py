"""
Processa os GeoJSON brutos de licenciamento ambiental (data/raw/) para o
formato consumido pelo site (data/processed/), conforme convenção do
CLAUDE.md: reprojeção/checagem de CRS, limpeza de atributos internos e
nomes de arquivo alinhados à camada exibida no site.

Fonte: SEMAD/SEMA-GO (licenciamento ambiental estadual), filtrado para o
município de Alto Paraíso de Goiás (código IBGE 5200605).

Uso: python3 scripts/process_licenciamento.py
"""

import json
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"

SOURCES = {
    "licenc_aambiental_estadolinha.geojson": "licenciamento_linhas.geojson",
    "licenc_aambiental_estadoplg.geojson": "licenciamento_areas.geojson",
    "licenc_aambiental_estadopt.geojson": "licenciamento_pontos.geojson",
}

# Mapeia campo bruto -> campo limpo. Campos ausentes deste mapa
# (codigosoli, tipo_feica, municipioi, dt_registr, id) são descartados:
# são identificadores internos do sistema estadual, sem valor para o
# público, e o município já é fixo (Alto Paraíso de Goiás).
FIELD_MAP = {
    "nome_tipo": "tipo_licenca",
    "nome_ativi": "atividade",
    "numero_pro": "numero_processo",
    "numero_lic": "numero_licenca",
    "dt_abertur": "data_abertura",
    "dt_validad": "validade_inicio",
    "dt_valida0": "validade_fim",
    "licenciado": "licenciado",
}


def clean_properties(props):
    cleaned = {}
    for raw_key, clean_key in FIELD_MAP.items():
        value = props.get(raw_key)
        if clean_key == "data_abertura" and isinstance(value, str):
            value = value.split(" ")[0]  # descarta timestamp, mantém a data
        cleaned[clean_key] = value
    return cleaned


def process(raw_name, out_name):
    with open(RAW_DIR / raw_name, encoding="utf-8") as f:
        raw = json.load(f)

    features = [
        {
            "type": "Feature",
            "geometry": feat["geometry"],
            "properties": clean_properties(feat["properties"]),
        }
        for feat in raw["features"]
        if not feat["properties"].get("excluido", False)
    ]

    out = {
        "type": "FeatureCollection",
        "crs": raw["crs"],
        "features": features,
    }

    out_path = PROCESSED_DIR / out_name
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    print(f"{raw_name} -> {out_name}: {len(features)} features")


if __name__ == "__main__":
    for raw_name, out_name in SOURCES.items():
        process(raw_name, out_name)
