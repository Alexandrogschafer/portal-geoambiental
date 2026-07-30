# Portal Geoambiental — Alto Paraíso de Goiás (SEMMA)

Geoportal municipal estático (sem backend) para a Secretaria Municipal de Meio
Ambiente (SEMMA) de Alto Paraíso de Goiás - GO.

> Regras completas de convenção do projeto estão em [`CLAUDE.md`](./CLAUDE.md).
> Leia antes de editar dados, estilo ou estrutura.

## Rodando localmente

Não há build. Basta servir a pasta raiz com qualquer servidor estático:

```bash
python -m http.server 8000
# ou
npx serve .
```

Depois abra `http://localhost:8000`.

> Abrir `index.html` direto do disco (`file://`) **não funciona bem**, pois o
> `fetch()` dos arquivos GeoJSON em `data/processed/` é bloqueado por CORS em
> alguns navegadores. Sempre use um servidor local.

## Estrutura

```
/
├── index.html              # página principal (mapa geral)
├── mapas/                  # uma página por camada temática (a criar)
├── css/style.css           # tokens de design + layout
├── js/
│   ├── map-core.js         # inicialização do Leaflet, mapas base
│   ├── layers.js           # carregamento/toggle das camadas GeoJSON
│   └── charts.js           # gráficos históricos dos indicadores (Chart.js)
├── data/
│   ├── raw/                # shapefiles originais (não versionados — ver .gitignore)
│   └── processed/          # GeoJSON/JSON prontos para o site (EPSG:4326)
│       └── FONTES.md       # origem e data de cada dado
├── assets/img/
└── CLAUDE.md
```

## Estado atual

- [x] Estrutura de pastas
- [x] `index.html` com layout (sidebar, hero, mapa, indicadores, créditos)
- [x] Mapa Leaflet inicializado (`map-core.js`) com mapa base satélite
- [x] Lógica de camadas com toggle (`layers.js`) — **aguardando os GeoJSON reais** em `data/processed/`
- [x] Lógica de gráficos históricos (`charts.js`) — dados de exemplo em `data/processed/*.json`
- [ ] GeoJSON reais das camadas (limite municipal, hidrografia, nascentes, UCs, APPs, área urbana)
- [ ] Páginas individuais em `mapas/` para cada camada temática
- [ ] Imagem de capa em `assets/img/hero-cachoeira.jpg` (placeholder ainda não incluído)
- [ ] Seções: Indicadores Ambientais, Banco de Dados, Fiscalização, Conservação, Biblioteca Técnica, Sobre

## Próximos passos sugeridos

1. Colocar os shapefiles brutos em `data/raw/` e converter para GeoJSON em
   `data/processed/` (ver receita no `CLAUDE.md`).
2. Adicionar a imagem de capa em `assets/img/`.
3. Validar o mapa localmente (`python -m http.server`) com pelo menos o
   `limite_municipal.geojson` para conferir o enquadramento do mapa.
4. Criar as páginas de `mapas/` conforme forem sendo processadas as camadas.

## Deploy

GitHub Pages, direto da branch `main` (raiz). Ver `CLAUDE.md > Deploy`.
