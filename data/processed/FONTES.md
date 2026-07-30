# Fontes de dados — Portal Geoambiental (SEMMA / Alto Paraíso de Goiás)

Este arquivo registra, para cada camada/indicador processado em `data/processed/`,
a fonte original, a data de referência e a data da última atualização no site.
Atualizar sempre que um dado for adicionado, reprocessado ou substituído.

| Arquivo | Camada / Indicador | Fonte | Data de referência dos dados | Última atualização no site | Observações |
|---|---|---|---|---|---|
| `limite_municipal.geojson` | Limite Municipal | _(preencher — ex. IBGE, malha municipal)_ | — | — | Soft-hyphen solto removido do campo `Nome` via `scripts/fix_encoding_mojibake.py` |
| `hidrografia.geojson` | Hidrografia | _(preencher)_ | — | — | |
| `nascentes.geojson` | Nascentes | Cadastro SEMMA | — | — | Encoding (mojibake) corrigido via `scripts/fix_encoding_mojibake.py` — raw já vinha corrompido |
| `unidades_conservacao.geojson` | Unidades de Conservação | _(preencher)_ | — | — | Encoding (mojibake) corrigido via `scripts/fix_encoding_mojibake.py` — raw já vinha corrompido |
| `apps.geojson` | APPs | _(preencher)_ | — | — | |
| `queimadas_AAAA.geojson` | Queimadas | MapBiomas (Coleção Fogo) | — | — | Um arquivo por ano |
| `desmatamento_AAAA.geojson` | Desmatamento | MapBiomas (Alerta) | — | — | Um arquivo por ano |
| `area_urbana.geojson` | Área Urbana | _(preencher)_ | — | — | |
| `fauna_atropelada.json` | Fauna Atropelada | Cadastro SEMMA / fiscalização | — | — | |
| `licenciamento.json` | Licenças Emitidas (histórico anual) | SEMMA | — | — | |
| `licenciamento_pontos.geojson` | Licenciamento Ambiental — pontos | SEMAD/SEMA-GO (licenciamento estadual) | — | — | Gerado por `scripts/process_licenciamento.py` a partir de `data/raw/licenc_aambiental_estadopt.geojson` |
| `licenciamento_areas.geojson` | Licenciamento Ambiental — áreas | SEMAD/SEMA-GO (licenciamento estadual) | — | — | Gerado por `scripts/process_licenciamento.py` a partir de `data/raw/licenc_aambiental_estadoplg.geojson` |
| `licenciamento_linhas.geojson` | Licenciamento Ambiental — linhas | SEMAD/SEMA-GO (licenciamento estadual) | — | — | Gerado por `scripts/process_licenciamento.py` a partir de `data/raw/licenc_aambiental_estadolinha.geojson` |
| `autos_infracao.json` | Autos de Infração (histórico anual) | SEMMA / fiscalização | — | — | |
| `autos_infracao_areas.geojson` | Autos de Infração — áreas | SEMAD/SEMA-GO (fiscalização estadual) | — | — | Gerado por `scripts/process_gpkg_layers.py` a partir de `data/raw/gpkg/autoinfrac_a_o_estadoplg.gpkg`. Texto de `categoria`/`nome` corrigido por transcrição manual (mojibake irreversível na origem). Campo `autuado` omitido para pessoa física — ver seção "Privacidade" abaixo |
| `autos_infracao_pontos.geojson` | Autos de Infração — pontos | SEMAD/SEMA-GO (fiscalização estadual) | — | — | Gerado por `scripts/process_gpkg_layers.py` a partir de `data/raw/gpkg/autoinfrac_a_o_estadopt.gpkg`. Campo `autuado` omitido para pessoa física — ver seção "Privacidade" abaixo |
| `supressao_vegetal.geojson` | Autorizações de Supressão de Vegetação | SEMAD/SEMA-GO (licenciamento estadual, sistema IPÊ) | — | — | Gerado por `scripts/process_gpkg_layers.py` a partir de `data/raw/gpkg/autorizac_a_osupressa_oveg_alto.gpkg`. Encoding (mojibake) corrigido |
| `cobertura_vegetal.json` | Cobertura Vegetal Nativa (%) | MapBiomas (Coleção de Cobertura e Uso) | — | — | |

## Convenções

- Datas no formato `AAAA-MM-DD`.
- Sempre que um dado vier do MapBiomas, manter o crédito "Fonte: MapBiomas" visível no card/indicador correspondente na UI.
- Ao reprocessar uma camada (nova simplificação, correção de atributos etc.), atualizar a coluna "Última atualização no site" mesmo que a fonte original não tenha mudado.

## Privacidade

- `autos_infracao_areas.geojson` / `autos_infracao_pontos.geojson`: o campo bruto `nome_razao` mistura pessoa física e pessoa jurídica/órgão público, e um registro da fonte trazia um CPF colado ao nome. Por decisão de privacidade, o campo `autuado` só é publicado quando `scripts/process_gpkg_layers.py` reconhece um marcador de pessoa jurídica ou órgão público (LTDA, EIRELI, S/A, EPP, HOLDING, INSTITUTO, AGENCIA, PREFEITURA, MUNICÍPIO, "- ME"); nome de pessoa física fica de fora do popup público, aparecendo só a infração, o processo, a data e o status. Reavaliar esse critério (ou a lista de marcadores) sempre que a fonte for reprocessada.
