# Portal Geoambiental — Alto Paraíso de Goiás (SEMMA)

Este arquivo orienta o Claude Code sobre as convenções deste projeto. Leia antes de criar ou editar qualquer arquivo.

## O que é o projeto

Geoportal municipal estático (sem backend) para a Secretaria Municipal de Meio Ambiente (SEMMA) de Alto Paraíso de Goiás - GO. Reúne mapas interativos e indicadores ambientais (hidrografia, nascentes, unidades de conservação, queimadas, desmatamento, animais atropelados, licenciamento) e o módulo de Fiscalização Ambiental (denúncia, contatos e autorizações de supressão de vegetação) para consulta pública e apoio à gestão. Ver "Estrutura de navegação (menu)" abaixo para a taxonomia completa.

Publicado como site estático no GitHub Pages. Não há servidor Python em produção — todo processamento de dados acontece localmente/offline e gera arquivos estáticos (GeoJSON, JSON, CSV) que o site consome no navegador.

## Estrutura de pastas

```
/
├── index.html               # página principal (mapa geral)
├── fiscalizacao-ambiental.html  # módulo que não é mapa espacial — fica na raiz, junto do index.html
├── mapas/                   # uma página por camada temática, se necessário
│   ├── hidrografia.html
│   ├── queimadas.html
│   └── ...
├── partials/                # sidebar.html / topbar.html, injetados via js/partials.js
├── css/
│   └── style.css            # se extrairmos do inline; ver "Design" abaixo
├── js/
│   ├── map-core.js          # inicialização do Leaflet, camadas base
│   ├── layers.js            # carregamento e toggle de camadas GeoJSON
│   ├── partials.js          # injeta sidebar/topbar compartilhados
│   └── charts.js            # gráficos (Chart.js / Plotly.js)
├── data/
│   ├── raw/                 # shapefiles e dados originais — NUNCA editar à mão, apenas ler
│   └── processed/           # GeoJSON simplificado e pronto para o site consumir
├── assets/
│   └── img/
└── CLAUDE.md
```

## Dados geoespaciais

- Shapefiles brutos ficam em `data/raw/`. São a fonte da verdade; não são consumidos diretamente pelo site.
- Todo dado usado no mapa deve existir como GeoJSON em `data/processed/`, no CRS **EPSG:4326 (WGS84)** — obrigatório para Leaflet/MapLibre.
- Ao converter shapefile → GeoJSON, sempre:
  1. Checar e reprojetar o CRS se necessário (`geopandas.to_crs(4326)` ou `ogr2ogr -t_srs EPSG:4326`)
  2. Simplificar geometria quando o arquivo for pesado (`geopandas` `.simplify()` ou `mapshaper`), mantendo topologia
  3. Manter só os atributos (colunas) relevantes para popup/exibição — remover campos internos desnecessários
  4. Nomear o arquivo de saída igual ao nome da camada no painel (ex.: `nascentes.geojson`, `hidrografia.geojson`, `unidades_conservacao.geojson`)
- Nunca commitar shapefile bruto se for muito grande — preferir manter só o GeoJSON processado no repositório (avaliar `.gitignore` para `data/raw/` se os arquivos forem grandes ou sensíveis).
- Cada camada processada deve ter a fonte e a data de referência registradas (ver seção "Créditos e fontes").

## Convenção de camadas do mapa

Cada camada do painel "Camadas" (`LAYER_CONFIG` em `js/layers.js`) segue este padrão:

| Camada | Tipo de geometria | Cor | Arquivo | Observação |
|---|---|---|---|---|
| Limite Municipal | linha (contorno) | branco tracejado | `limite_municipal.geojson` | |
| Hidrografia | linha | azul `#2f7fb0` | `hidrografia.geojson` | Página própria: `mapas/hidrografia.html` |
| Nascentes | ponto | azul claro `#5fb0e0` | `nascentes.geojson` | Sem página própria — sub-camada dentro de `mapas/hidrografia.html`, com toggle próprio no painel de Camadas (`initMultiLayerPage()` em `js/layers.js`) |
| Unidades de Conservação | polígono | verde `#6fb178` | `unidades_conservacao.geojson` | Página própria: `mapas/unidades-conservacao.html` |
| Virada Ambiental | a definir | a definir | ainda não processado | Página `mapas/virada-ambiental.html` existe, mas mostra apenas mapa base + limite municipal com aviso "Dados em levantamento" até o GeoJSON ser processado |
| Queimadas | polígono/heatmap | terracota `#c96a3c` | `queimadas_AAAA.geojson` (um por ano, se aplicável) | Página própria: `mapas/queimadas.html` |
| Desmatamento | polígono | vermelho `#e63946` | `desmatamento_AAAA.geojson` | Página própria: `mapas/desmatamento.html` |
| Animais Atropelada | ponto (planejado) | marrom `--soil: #8a5a3c` | `fauna_atropelada.json` (indicador; camada de pontos ainda não processada) | Página própria: `mapas/fauna-atropelada.html`. Nome do arquivo mantido por compatibilidade — só a label visível mudou de "Fauna Atropelada" |
| Áreas Públicas Municipais (APM) | a definir | a definir | ainda não processado | Página `mapas/apm.html` existe, mas mostra apenas mapa base + limite municipal com aviso "Dados em levantamento" até o GeoJSON ser processado |
| Licenciamento Ambiental | ponto/linha/polígono | âmbar `#c99a3c` | `licenciamento_{pontos,linhas,areas}.geojson` | Página própria: `mapas/licenciamento.html` |
| APPs | polígono | amarelo `#c99a3c` | `apps.geojson` | Ainda não tem página própria nem item de menu — só carregada no mapa geral (`index.html`) |
| Área Urbana | polígono | cinza | `area_urbana.geojson` | Ainda não tem página própria nem item de menu — só carregada no mapa geral (`index.html`) |

Camadas novas devem seguir o mesmo padrão: entrada na tabela acima, checkbox no painel de camadas, `layerGroup` próprio em `js/layers.js`. Para uma página com mais de uma camada toggleável (ex.: Hidrografia + Nascentes), use `data-layer-keys="chave1,chave2"` no `<body>` em vez de `data-layer-key` — `initMultiLayerPage()` cuida do toggle individual de cada uma. Se a camada ainda não tem dado processado, **não** deixe a ausência falhar silenciosamente (esse é o padrão do `fetchGeoJSON()` de `js/layers.js`, que só loga um aviso no console) — mostre um aviso visível na página, como em `mapas/virada-ambiental.html`/`mapas/apm.html`.

## Estrutura de navegação (menu)

**Mapas Interativos** (`mapas/*.html`, nesta ordem no menu): Mapa Geral, Unidades de Conservação, Hidrografia (com Nascentes como sub-camada), Virada Ambiental, Queimadas, Desmatamento, Animais Atropelada, Áreas Públicas Municipais (APM), Licenciamento Ambiental.

**Módulos** (páginas fora de `mapas/`, não são mapas espaciais): Indicadores Ambientais, Fiscalização Ambiental (`fiscalizacao-ambiental.html` — formulário de denúncia ambiental, contatos da SEMMA e tabela de Autorizações de Supressão de Vegetação reaproveitando `data/processed/supressao_vegetal.geojson`), Conservação Ambiental, Biblioteca Técnica, Sobre a Plataforma. A maioria ainda são placeholders vazios na sidebar (`partials/sidebar.html`), a preencher em fases futuras.

**Autos de Infração foi removido do escopo do portal** (não é mais um módulo nem um mapa). Os shapefiles brutos permanecem em `data/raw/` só como referência histórica; nada em `data/processed/` ou no HTML do site referencia mais essa camada — ver `data/processed/FONTES.md` > "Removido do escopo". Não reintroduzir sem confirmar com a SEMMA.

## Design — tokens visuais

Já definidos no protótipo (`index.html`), manter consistência:

- **Cores**: verde-floresta como cor primária (`--forest-800: #173c26`, `--forest-600: #2b6b41`, `--forest-500: #3c8a55`), fundo areia claro (`--sand-50: #fbfaf7`), acentos por categoria de dado (azul água `#2f7fb0`, terracota queimadas `#c96a3c`, âmbar licenciamento/supressão, violeta indicadores institucionais).
- **Tipografia**: `Fraunces` (serif) para títulos/display, `Inter` para corpo de texto e UI.
- **Componentes**: cards com `border-radius: 10-16px`, sombra suave (`--shadow`), bordas `1px solid var(--line)`.
- Não introduzir nova paleta ou fonte sem justificar — manter a identidade visual institucional (verde SEMMA).

## Gráficos e indicadores

- Usar **Chart.js** (ou Plotly.js se precisar de interatividade mais rica, como zoom/pan em séries temporais) via CDN, sem bundler.
- Cada indicador do topo (cobertura vegetal, área queimada, nascentes, UCs, animais atropelados, licenças) deve idealmente linkar para uma página/seção com o gráfico histórico correspondente, não só o número atual.
- Dados dos gráficos ficam em `data/processed/` como JSON/CSV simples (ano, valor, fonte).

## Créditos e fontes

Sempre que uma camada ou indicador vier de fonte externa (ex.: MapBiomas para queimadas/desmatamento), manter o crédito visível na UI (como no card "Fonte: MapBiomas") e documentar a fonte e a data de atualização dos dados em um arquivo `data/processed/FONTES.md` ou similar.

## Deploy

- Site estático puro (HTML/CSS/JS), sem etapa de build obrigatória — compatível com **GitHub Pages** direto (`Settings → Pages → Deploy from branch → main /root`, ou `/docs` se preferirmos isolar os arquivos publicáveis).
- Testar localmente antes de subir: `python -m http.server` (ou `npx serve`) na raiz do projeto.
- Não expor dados sensíveis (ex.: localização exata de nascentes/UCs privadas, se houver restrição) — checar antes de publicar.

## O que evitar

- Não introduzir framework pesado (React, Vue) sem necessidade real — o site é simples o suficiente para HTML/CSS/JS + Leaflet + Chart.js.
- Não deixar lógica de conversão de dados dentro do HTML — scripts de processamento (Python) ficam separados, fora do que é servido publicamente.
- Não commitar credenciais, chaves de API ou dados brutos sensíveis.
