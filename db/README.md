# `db/` — dados e artefatos de treino

Esta pasta é para armazenar **datasets** e **artefatos** usados no treinamento de modelos (machine learning).
Este repositório **versiona** o conteúdo de `db/` (ou seja, ele pode ir para o GitHub).

## Estrutura sugerida

- **`raw/`**: dados brutos (entrada original; não editar manualmente)
- **`processed/`**: dados processados/normalizados (features, embeddings, etc.)
- **`splits/`**: divisões de treino/validação/teste e manifestos (ex.: `train.csv`, `val.csv`)
- **`models/`**: checkpoints, pesos, métricas e logs do treinamento

Se você quiser uma estrutura diferente (por exemplo `db/images/`, `db/labels/`, `db/cache/`), é só pedir que eu ajusto.

