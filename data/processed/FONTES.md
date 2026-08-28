# Fontes de dados — Portal Geoambiental (SEMMA / Alto Paraíso de Goiás)

Este arquivo registra, para cada camada/indicador processado em `data/processed/`,
a fonte original, a data de referência e a data da última atualização no site.
Atualizar sempre que um dado for adicionado, reprocessado ou substituído.

| Arquivo | Camada / Indicador | Fonte | Data de referência dos dados | Última atualização no site | Observações |
|---|---|---|---|---|---|
| `limite_municipal.geojson` | Limite Municipal | _(preencher — ex. IBGE, malha municipal)_ | — | — | Soft-hyphen solto removido do campo `Nome` via `scripts/fix_encoding_mojibake.py` |
| `hidrografia.geojson` | Hidrografia | _(preencher)_ | — | — | |
| `nascentes.geojson` | Nascentes | Cadastro SEMMA | — | — | Encoding (mojibake) corrigido via `scripts/fix_encoding_mojibake.py` — raw já vinha corrompido. Sem página própria: carregada como sub-camada dentro de `mapas/hidrografia.html` |
| `unidades_conservacao.geojson` | Unidades de Conservação | _(preencher)_ | — | — | Encoding (mojibake) corrigido via `scripts/fix_encoding_mojibake.py` — raw já vinha corrompido |
| `apps.geojson` | APPs | _(preencher)_ | — | — | |
| `queimadas_AAAA.geojson` | Queimadas | MapBiomas (Coleção Fogo) | — | — | Um arquivo por ano |
| `desmatamento_AAAA.geojson` | Desmatamento | MapBiomas (Alerta) | — | — | Um arquivo por ano |
| `area_urbana.geojson` | Área Urbana | _(preencher)_ | — | — | |
| `fauna_atropelada.json` | Animais Atropelada | Cadastro SEMMA / fiscalização | — | — | Nome do arquivo mantido (`fauna_atropelada.json`); label visível no site é "Animais Atropelada" |
| `licenciamento.json` | Licenças Emitidas (histórico anual) | SEMMA | — | — | |
| `licenciamento_pontos.geojson` | Licenciamento Ambiental — pontos | SEMAD/SEMA-GO (licenciamento estadual) | — | — | Gerado por `scripts/process_licenciamento.py` a partir de `data/raw/licenc_aambiental_estadopt.geojson` |
| `licenciamento_areas.geojson` | Licenciamento Ambiental — áreas | SEMAD/SEMA-GO (licenciamento estadual) | — | — | Gerado por `scripts/process_licenciamento.py` a partir de `data/raw/licenc_aambiental_estadoplg.geojson` |
| `licenciamento_linhas.geojson` | Licenciamento Ambiental — linhas | SEMAD/SEMA-GO (licenciamento estadual) | — | — | Gerado por `scripts/process_licenciamento.py` a partir de `data/raw/licenc_aambiental_estadolinha.geojson` |
| `supressao_vegetal.geojson` | Autorizações de Supressão de Vegetação | SEMAD/SEMA-GO (licenciamento estadual, sistema IPÊ) | — | — | Gerado por `scripts/process_gpkg_layers.py` a partir de `data/raw/gpkg/autorizac_a_osupressa_oveg_alto.gpkg`. Encoding (mojibake) corrigido. Sem mapa próprio: listado como tabela em `fiscalizacao-ambiental.html` (módulo Fiscalização Ambiental) |
| `cobertura_vegetal.json` | Cobertura Vegetal Nativa (%) | MapBiomas (Coleção de Cobertura e Uso) | — | — | |
| `sistema_viario.geojson` | Sistema Viário Municipal | OpenStreetMap contributors | 2026-08-27 | 2026-08-27 | Extraído via `scripts/extract_osm_viario.py` (`osmnx.graph_from_polygon`, `network_type='drive'`), recortado pelo limite municipal. 2410 segmentos — residential (1166), unclassified (880), tertiary (192), primary (158), primary_link (10), tertiary_link (4). **Licença ODbL — atribuição "© OpenStreetMap contributors" obrigatória sempre que a camada estiver visível** (ver seção "Convenções" abaixo); implementada via `map.attributionControl` do Leaflet em `js/layers.js` |

## Convenções

- Datas no formato `AAAA-MM-DD`.
- Sempre que um dado vier do MapBiomas, manter o crédito "Fonte: MapBiomas" visível no card/indicador correspondente na UI.
- Sempre que um dado vier do OpenStreetMap (licença ODbL), manter o crédito "© OpenStreetMap contributors" visível enquanto a camada estiver ativa — não é opcional, é exigência da licença.
- Ao reprocessar uma camada (nova simplificação, correção de atributos etc.), atualizar a coluna "Última atualização no site" mesmo que a fonte original não tenha mudado.

## Removido do escopo

- Autos de Infração (`autos_infracao.json`, `autos_infracao_areas.geojson`, `autos_infracao_pontos.geojson`) saiu definitivamente do portal — ver CLAUDE.md. Os shapefiles brutos (`data/raw/autoinfrac_a_o_estadoplg.geojson`, `data/raw/autoinfrac_a_o_estadopt.geojson`) foram mantidos em `data/raw/` apenas como referência histórica; nada em `data/processed/` ou no site referencia mais essa camada.
