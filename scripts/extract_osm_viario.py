"""
extract_osm_viario.py

Extrai o Sistema Viário Municipal (malha viária) de Alto Paraíso de Goiás
a partir do OpenStreetMap, usando osmnx, recortado pelo polígono do
limite municipal já processado (data/processed/limite_municipal.geojson).

Uso:
    python3 scripts/extract_osm_viario.py

Saída:
    data/processed/sistema_viario.geojson (CRS EPSG:4326)

Fonte dos dados: OpenStreetMap contributors, licença ODbL — atribuição
"© OpenStreetMap contributors" é obrigatória sempre que a camada estiver
visível no site (ver CLAUDE.md e data/processed/FONTES.md).
"""

import geopandas as gpd
import osmnx as ox

LIMITE_PATH = "data/processed/limite_municipal.geojson"
OUTPUT_PATH = "data/processed/sistema_viario.geojson"

# Colunas mantidas para popup no mapa — o resto (osmid, u, v, key, ref,
# oneway, reversed, length, lanes, maxspeed, bridge, junction, width,
# access, tunnel etc., que vêm por padrão do grafo do OSM) é descartado
# por não servir para exibição pública.
KEEP_COLUMNS = ["name", "highway", "geometry"]

# Tolerância de simplificação em graus (~5m no equador) — só aplicada se
# o arquivo de saída ficar pesado (ver SIZE_THRESHOLD_MB abaixo).
SIMPLIFY_TOLERANCE = 0.00005
SIZE_THRESHOLD_MB = 3


def carregar_poligono_municipio():
    limite = gpd.read_file(LIMITE_PATH)
    if limite.crs is None or limite.crs.to_epsg() != 4326:
        limite = limite.to_crs(4326)
    return limite.geometry.iloc[0]


def extrair_viario(poligono):
    grafo = ox.graph_from_polygon(poligono, network_type="drive")
    arestas = ox.graph_to_gdfs(grafo, nodes=False)
    return arestas


def limpar_atributos(gdf):
    for col in KEEP_COLUMNS:
        if col not in gdf.columns:
            gdf[col] = None

    gdf = gdf[KEEP_COLUMNS].copy()

    # highway/name às vezes vêm como lista (via com mais de uma
    # classificação/nome no OSM) — achata para string, pega o primeiro
    # valor, mantém popup simples.
    for col in ["name", "highway"]:
        gdf[col] = gdf[col].apply(lambda v: v[0] if isinstance(v, list) else v)

    return gdf.reset_index(drop=True)


def main():
    poligono = carregar_poligono_municipio()
    print("Baixando malha viária (network_type='drive') via Overpass API...")
    arestas = extrair_viario(poligono)

    gdf = limpar_atributos(arestas)
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(4326)

    gdf.to_file(OUTPUT_PATH, driver="GeoJSON")
    tamanho_mb = _tamanho_mb(OUTPUT_PATH)

    if tamanho_mb > SIZE_THRESHOLD_MB:
        print(f"Arquivo com {tamanho_mb:.1f} MB — simplificando geometria (tolerância {SIMPLIFY_TOLERANCE})...")
        gdf["geometry"] = gdf.geometry.simplify(SIMPLIFY_TOLERANCE, preserve_topology=True)
        gdf.to_file(OUTPUT_PATH, driver="GeoJSON")
        tamanho_mb = _tamanho_mb(OUTPUT_PATH)

    print(f"\n{len(gdf)} segmentos de via exportados para {OUTPUT_PATH} ({tamanho_mb:.2f} MB).")
    print("\nTipos de via (highway) encontrados:")
    print(gdf["highway"].value_counts(dropna=False).to_string())


def _tamanho_mb(path):
    import os
    return os.path.getsize(path) / (1024 * 1024)


if __name__ == "__main__":
    main()
