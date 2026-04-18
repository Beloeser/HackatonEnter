# HackatonEnter

Documentação completa do pipeline de Machine Learning jurídico deste repositório.

## Objetivo do Projeto
Este projeto calcula duas coisas para cada processo:

- `taxa_vitoria`: probabilidade estimada de vitória do banco.
- `valor_acordo_proposto`: valor de acordo sugerido para minimizar custo esperado.

O fluxo é em duas etapas sequenciais:

1. Modelo de vitória (`SucessRate`) com Gaussian Process (GP).
2. Modelo de acordo (`Acordo`) por otimização matemática direta (sem GP).

## Visão Geral do Fluxo
1. Dados brutos entram em `db/raw/Hackaton_Enter_Base_Candidatos.csv`.
2. O treino de vitória gera `db/processed/gp_treino_resultados.csv`.
3. O treino de acordo consome esse CSV e gera `db/processed/gp_acordo_treino_resultados.csv`.

## Estrutura Relevante
```text
backend/ml/merge_excel.py
backend/ml/models/SucessRate/train_vitoria_gp.py
backend/ml/models/Acordo/train_acordo_gp.py

db/raw/Hackaton_Enter_Base_Candidatos.csv
db/processed/gp_treino_resultados.csv
db/processed/gp_acordo_treino_resultados.csv
```

## Dependências
Arquivo: `backend/requirements.txt`

- `numpy`
- `pandas`
- `scikit-learn`
- `scipy`
- `openpyxl`
- `joblib` (mantido por compatibilidade de ambiente; não há salvamento de `.joblib` no fluxo atual)

Instalação:
```bash
cd backend
pip install -r requirements.txt
```

## Etapa 0 (Opcional): Converter Excel para CSV
Script: `backend/ml/merge_excel.py`

Use este script apenas se a origem ainda for `.xlsx`. Ele junta abas de subsídios e resultados por número de processo.

Exemplo:
```bash
.venv/bin/python backend/ml/merge_excel.py \
  --input-file db/algum_arquivo.xlsx \
  --output-csv db/raw/Hackaton_Enter_Base_Candidatos.csv
```

### O que ele faz
- Lê duas abas de Excel.
- Resolve nomes de coluna-chave com pequenas variações (`processo` vs `processos`).
- Faz `merge` (default `left`).
- Exporta CSV UTF-8 com BOM.

## Etapa 1: Modelo de Vitória (SucessRate)
Script: `backend/ml/models/SucessRate/train_vitoria_gp.py`

### Finalidade
Estimar `taxa_vitoria` e `incerteza` por processo.

### Entradas mínimas esperadas no dataset
- `Sub-assunto`
- `Valor da causa`
- `Resultado micro`
- `Contrato` (subsídio binário)
- `Extrato` (subsídio binário)
- `Comprovante de crédito` (subsídio binário)
- `Dossiê` (subsídio binário)
- `Demonstrativo de evolução da dívida` (subsídio binário)
- `Laudo referenciado` (subsídio binário)

### Tratamento de dados
- Conversão numérica de colunas numéricas com `errors="coerce"`.
- Preenchimento de faltantes com zero onde aplicável.
- Filtro opcional por classe de desfecho (`Resultado micro == Extinção` é removido por padrão).
- Criação de feature agregada `quantidade_subsidios = soma das 6 colunas binárias de subsídio`.

### Features usadas no modelo
- Categórica: `Sub-assunto`
- Numéricas: `Valor da causa`, `quantidade_subsidios`

### Modelo matemático
O script treina um Gaussian Process Regressor com kernel:

`k(x, x') = C * RBF + WhiteKernel`

onde:
- `C` ajusta escala global.
- `RBF` modela suavidade da função.
- `WhiteKernel` modela ruído.

No modo padrão atual (`vitoria_macro`):
- coluna alvo: `Resultado macro`
- classe positiva: `Êxito` (vitória do banco)
- `taxa_vitoria = score_gp`

No modo alternativo (`severidade_micro`), o alvo é:
- `Improcedência -> 0`
- `Parcial procedência -> 0.5`
- `Procedência -> 1`
- `Acordo -> 0.5`

Depois da predição do GP:
- `score_gp = média posterior`
- `incerteza = desvio padrão posterior`
- `taxa_vitoria = score_gp` (no modo `vitoria_macro`)
- `taxa_vitoria = 1 - score_gp` (no modo `severidade_micro`)

### Por que GP nesta etapa
- O GP entrega duas saídas úteis ao mesmo tempo: estimativa (`média posterior`) e confiança (`desvio padrão posterior`).
- No jurídico, essa incerteza é importante para risco de decisão e para calibrar estratégias posteriores.
- O kernel `RBF + WhiteKernel` é uma escolha robusta para relação não linear com ruído nos dados.

### Pré-processamento interno
- Categórica com `OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)`.
- Padronização com `StandardScaler`.
- Pipeline com `ColumnTransformer`.

### Saída
Arquivo: `db/processed/gp_treino_resultados.csv`

Colunas principais:
- `numero_processo` (quando disponível)
- `taxa_vitoria`
- `incerteza`
- `valor_da_causa`

### Métricas reportadas no terminal
- `mean_std`
- Se `target_mode = severidade_micro`: `mse`, `mae`
- Se `target_mode = vitoria_macro`: `roc_auc`, `accuracy@0.5`, `brier`

### Comando recomendado
```bash
.venv/bin/python backend/ml/models/SucessRate/train_vitoria_gp.py \
  --input-file db/raw/Hackaton_Enter_Base_Candidatos.csv \
  --predictions-csv-out db/processed/gp_treino_resultados.csv \
  --model-out db/processed/gp_vitoria_model.joblib
```

Para treino rápido (ambiente limitado):
```bash
.venv/bin/python backend/ml/models/SucessRate/train_vitoria_gp.py \
  --input-file db/raw/Hackaton_Enter_Base_Candidatos.csv \
  --predictions-csv-out db/processed/gp_treino_resultados.csv \
  --model-out db/processed/gp_vitoria_model.joblib \
  --max-train-rows 500
```

## Etapa 2: Modelo de Acordo (Acordo)
Script: `backend/ml/models/Acordo/train_acordo_gp.py`

Este script **não usa GP**. Ele resolve uma otimização por processo com `scipy.optimize.minimize` (`L-BFGS-B`).

### Finalidade
Encontrar `valor_acordo_proposto` que minimiza custo total esperado.

### Entradas mínimas
- `taxa_vitoria`
- `valor_da_causa`

### Formulação matemática
Para cada processo:

- `V = valor_da_causa`
- `P_v = taxa_vitoria`
- `E[V_perda] = V * (1 - P_v)`

Probabilidade de aceite da contraparte:

`p_aceite(S) = 1 / (1 + exp(-k * (S - alpha * E[V_perda])))`

com:
- `k = k_base / max(V, 1)` (escala por tamanho da causa)
- `alpha` controla ancoragem da aceitação

Custo total esperado:

`CE(S) = p_aceite(S) * S + (1 - p_aceite(S)) * (E[V_perda] + C_extra)`

com:
- `C_extra = c_extra_fixed + c_extra_ratio * V`

Otimização:
- minimiza `CE(S)` em bounds `[low, high]`
- `low = min_offer_frac * V`
- `high = min(max_offer_frac * V, E[V_perda])`
- chute inicial `x0 = x0_frac * E[V_perda]` (clamp nos bounds)

### Por que otimização direta (sem GP) nesta etapa
- Aqui já existe uma função de negócio explícita (`CE(S)`) para minimizar.
- O problema é unidimensional em `S`, então `L-BFGS-B` resolve rápido e de forma estável.
- Como a função já representa o trade-off financeiro, não há necessidade de um segundo modelo probabilístico para estimar `S`.

### Interpretação de extremos
- Se `taxa_vitoria ~ 1`, então `E[V_perda] ~ 0`, e o acordo ótimo tende a `0`.
- Se `taxa_vitoria ~ 0`, `E[V_perda]` cresce, e o acordo ótimo tende a ser maior.

### Saída
Arquivo: `db/processed/gp_acordo_treino_resultados.csv`

Colunas principais:
- `numero_processo` (quando disponível)
- `taxa_vitoria`
- `valor_da_causa`
- `valor_esperado_perda`
- `probabilidade_aceite`
- `custo_total_esperado`
- `valor_acordo_proposto`

### Comando recomendado
```bash
.venv/bin/python backend/ml/models/Acordo/train_acordo_gp.py \
  --input-csv db/processed/gp_treino_resultados.csv \
  --output-csv db/processed/gp_acordo_treino_resultados.csv
```

## Parâmetros Importantes (Acordo)
Parâmetros do script e impacto prático:

- `--alpha`: maior `alpha` desloca a curva logística para ofertas mais altas.
- `--k-base`: maior `k-base` deixa a transição de aceite mais íngreme.
- `--c-extra-fixed`: maior custo fixo de litígio aumenta incentivo ao acordo.
- `--c-extra-ratio`: adiciona custo variável proporcional ao valor da causa.
- `--min-offer-frac` e `--max-offer-frac`: definem faixa admissível da proposta.
- `--x0-frac`: define o chute inicial da otimização.

## Execução End-to-End
```bash
# 1) (Opcional) Excel -> CSV bruto
.venv/bin/python backend/ml/merge_excel.py \
  --input-file db/arquivo.xlsx \
  --output-csv db/raw/Hackaton_Enter_Base_Candidatos.csv

# 2) Treino da vitória (GP)
.venv/bin/python backend/ml/models/SucessRate/train_vitoria_gp.py \
  --input-file db/raw/Hackaton_Enter_Base_Candidatos.csv \
  --predictions-csv-out db/processed/gp_treino_resultados.csv \
  --model-out db/processed/gp_vitoria_model.joblib

# 3) Otimização do acordo (sem GP)
.venv/bin/python backend/ml/models/Acordo/train_acordo_gp.py \
  --input-csv db/processed/gp_treino_resultados.csv \
  --output-csv db/processed/gp_acordo_treino_resultados.csv
```

## Execução End-to-End (Rápida para GitHub)
Use este fluxo quando quiser gerar CSVs atualizados rapidamente para commit/push:

```bash
# 1) Treino rápido da vitória
.venv/bin/python backend/ml/models/SucessRate/train_vitoria_gp.py \
  --input-file db/raw/Hackaton_Enter_Base_Candidatos.csv \
  --predictions-csv-out db/processed/gp_treino_resultados.csv \
  --model-out db/processed/gp_vitoria_model.joblib \
  --max-train-rows 500

# 2) Atualiza acordo com base no CSV acima
.venv/bin/python backend/ml/models/Acordo/train_acordo_gp.py \
  --input-csv db/processed/gp_treino_resultados.csv \
  --output-csv db/processed/gp_acordo_treino_resultados.csv
```

## Análise de Contrato Novo (Inferência)
Script: `backend/ml/analise.py`

Objetivo: usar o modelo de vitória já treinado para 1 contrato novo, calcular `taxa_vitoria`, `valor_acordo_proposto` e retornar recomendação final (`Buscar acordo` ou `Ir para defesa`).

Exemplo (modelo já treinado):
```bash
.venv/bin/python backend/ml/analise.py \
  --model-file db/processed/gp_vitoria_model.joblib \
  --contrato-json '{"Número do processo":"9999999-99.2026.8.01.0001","Contrato":1,"Extrato":1,"Comprovante de crédito":0,"Dossiê":1,"Demonstrativo de evolução da dívida":1,"Laudo referenciado":0,"Sub-assunto":"Golpe","Valor da causa":12000}'
```

Exemplo (treina fallback se não existir modelo):
```bash
.venv/bin/python backend/ml/analise.py \
  --model-file db/processed/gp_vitoria_model.joblib \
  --train-if-missing \
  --max-train-rows 500
```

## Como Ler Linhas Específicas de Resultado
Ao falar "linha 1009", alinhe a convenção:

- Linha física do arquivo CSV inclui cabeçalho como linha 1.
- Primeira linha de dado é linha 2.

Exemplo rápido:
```bash
sed -n '1009p' db/processed/gp_acordo_treino_resultados.csv
sed -n '1009p' db/processed/gp_treino_resultados.csv
```

## Limitações e Observações
- O GP de vitória pode ter custo computacional alto para volume muito grande; use `--max-train-rows` quando necessário.
- `incerteza` existe no modelo de vitória; no acordo atual não há incerteza de modelo, pois a saída é otimização determinística.
- A qualidade final depende fortemente da qualidade semântica de `Resultado micro` e consistência das colunas de subsídio.

## Checklist de Sanidade Após Treino
- `db/processed/gp_treino_resultados.csv` existe e tem colunas `taxa_vitoria`, `incerteza`, `valor_da_causa`.
- `db/processed/gp_acordo_treino_resultados.csv` existe e tem `valor_acordo_proposto`.
- Não há valores negativos em `valor_acordo_proposto`.
- Casos com `taxa_vitoria` muito alta tendem a acordo proposto baixo.

## Sobre o Nome da Pasta `SucessRate`
A pasta está nomeada como `SucessRate` no código atual para manter compatibilidade com os scripts já em uso. Se quiser padronizar para `SuccessRate`, faça o rename com ajuste de caminhos.

## Endpoints Backend para o Front
Com o backend rodando (`cd backend && npm run dev`), os endpoints disponíveis são:

### 1) Listar contratos em andamento
`GET /api/analise/contratos-em-andamento`

Resposta exemplo:
```json
{
  "success": true,
  "total": 10,
  "contratos": [
    {
      "indice": 0,
      "numero_processo": "1803258-78.2026.8.18.4949",
      "sub_assunto": "Golpe",
      "valor_da_causa": 19553.37
    }
  ]
}
```

### 2) Analisar contrato selecionado
`POST /api/analise/analisar-contrato`

Body (por índice):
```json
{ "indice": 0 }
```

Body (por número do processo):
```json
{ "numeroProcesso": "6957247-73.2026.8.05.9104" }
```

Resposta padrão (resumo):
```json
{
  "success": true,
  "resultado": {
    "taxa_probabilidade_vitoria": 60.3,
    "fazer_acordo": true,
    "valor_acordo_justo": 5132.23
  }
}
```
