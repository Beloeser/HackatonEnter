"""
Fluxo de análise para contrato novo:
1) carregar modelo de vitória já treinado (ou treinar fallback)
2) prever chance de vitória do novo contrato
3) otimizar valor de acordo
4) decidir se vale a pena acordo ou defesa
"""

import argparse
import json
import os
from math import ceil
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd

from models.Acordo.train_acordo_gp import _otimizar_um_caso
from models.SucessRate.train_vitoria_gp import (
    SUBSIDIO_COLUMNS,
    _add_quantidade_subsidios,
    _aplicar_regra_subsidios,
    _build_pipeline,
    _load_dataset,
    _predict_proba_with_uncertainty,
    _prepare_xy,
    _to_taxa_vitoria,
)


DEFAULT_CONTRATO = {
    "Número do processo": "1764352-89.2025.8.06.1818",
    "Contrato": 0,
    "Extrato": 0,
    "Comprovante de crédito": 0,
    "Dossiê": 1,
    "Demonstrativo de evolução da dívida": 1,
    "Laudo referenciado": 1,
    "UF": "CE",
    "Assunto": "Não reconhece operação",
    "Sub-assunto": "Genérico",
    "Valor da causa": 13534.0,
}


CONTRATO_REQUIRED_FIELDS = [
    "Número do processo",
    "Contrato",
    "Extrato",
    "Comprovante de crédito",
    "Dossiê",
    "Demonstrativo de evolução da dívida",
    "Laudo referenciado",
    "Sub-assunto",
    "Valor da causa",
]


@dataclass
class AnaliseReport:
    status: str
    model_source: str
    model_file: str
    chance_vitoria: float
    incerteza: float
    chance_vitoria_percentual: float
    valor_da_causa: float
    valor_esperado_perda: float
    valor_acordo_proposto: float
    probabilidade_aceite: float
    custo_total_esperado_acordo: float
    custo_esperado_defesa: float
    economia_esperada_com_acordo: float
    vale_pena_acordo: bool
    recomendacao: str
    contrato_analisado: Dict[str, Any]


def _normalizar_contrato(raw: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise TypeError("Contrato deve ser um objeto JSON (dicionário).")

    contrato = dict(raw)
    missing = [c for c in CONTRATO_REQUIRED_FIELDS if c not in contrato]
    if missing:
        raise KeyError(f"Contrato sem campos obrigatórios: {missing}")

    for c in SUBSIDIO_COLUMNS:
        v = pd.to_numeric(pd.Series([contrato.get(c, 0)]), errors="coerce").fillna(0).iloc[0]
        contrato[c] = int(np.clip(v, 0, 1))

    contrato["Sub-assunto"] = str(contrato["Sub-assunto"])
    contrato["Valor da causa"] = _float_or_error(contrato["Valor da causa"], "Valor da causa")

    # Evita NaN em saída JSON (ex.: colunas extras vindas de CSV)
    for k, v in list(contrato.items()):
        if pd.isna(v):
            contrato[k] = None

    return contrato


def _carregar_contratos_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"CSV de contratos não encontrado: '{path}'")
    df = pd.read_csv(path)
    missing = [c for c in CONTRATO_REQUIRED_FIELDS if c not in df.columns]
    if missing:
        raise KeyError(f"CSV sem colunas obrigatórias: {missing}")
    return df


def _listar_contratos(df: pd.DataFrame) -> List[str]:
    linhas = []
    for i, row in df.iterrows():
        processo = str(row["Número do processo"])
        sub = str(row["Sub-assunto"])
        valor = pd.to_numeric(pd.Series([row["Valor da causa"]]), errors="coerce").fillna(0).iloc[0]
        linhas.append(f"[{i}] {processo} | {sub} | Valor da causa: R$ {float(valor):,.2f}")
    return linhas


def _listar_contratos_json(df: pd.DataFrame) -> Dict[str, Any]:
    contratos: List[Dict[str, Any]] = []
    for i, row in df.iterrows():
        valor = pd.to_numeric(pd.Series([row["Valor da causa"]]), errors="coerce").fillna(0).iloc[0]
        contratos.append(
            {
                "indice": int(i),
                "numero_processo": str(row["Número do processo"]),
                "sub_assunto": str(row["Sub-assunto"]),
                "valor_da_causa": float(valor),
            }
        )
    return {
        "status": "success",
        "total": int(len(contratos)),
        "contratos": contratos,
    }


def _selecionar_contrato_interativo(df: pd.DataFrame) -> Dict[str, Any]:
    print("\n=== CONTRATOS DISPONÍVEIS ===")
    for line in _listar_contratos(df):
        print(line)
    print()

    escolha = input("Digite o índice do contrato para analisar: ").strip()
    if not escolha:
        raise ValueError("Nenhum índice informado.")
    if not escolha.isdigit():
        raise ValueError(f"Índice inválido: '{escolha}'. Informe um número inteiro.")

    idx = int(escolha)
    if idx < 0 or idx >= len(df):
        raise IndexError(f"Índice fora do intervalo: {idx}. Use de 0 a {len(df) - 1}.")
    return df.iloc[idx].to_dict()


def _carregar_contrato(args: argparse.Namespace) -> Dict[str, Any]:
    select_modes = [
        bool(args.contrato_json),
        bool(args.contrato_json_file),
        args.contrato_indice is not None,
        bool(args.contrato_processo),
        bool(args.interativo),
    ]
    if sum(select_modes) > 1:
        raise ValueError(
            "Use apenas um modo de seleção de contrato: --contrato-json, --contrato-json-file, "
            "--contrato-indice, --contrato-processo ou --interativo."
        )

    if args.contrato_json:
        contrato = _normalizar_contrato(json.loads(args.contrato_json))
    elif args.contrato_json_file:
        with open(args.contrato_json_file, "r", encoding="utf-8") as f:
            contrato = _normalizar_contrato(json.load(f))
    elif args.contrato_indice is not None:
        df = _carregar_contratos_csv(args.contratos_csv)
        idx = int(args.contrato_indice)
        if idx < 0 or idx >= len(df):
            raise IndexError(f"Índice fora do intervalo: {idx}. Use de 0 a {len(df) - 1}.")
        contrato = _normalizar_contrato(df.iloc[idx].to_dict())
    elif args.contrato_processo:
        df = _carregar_contratos_csv(args.contratos_csv)
        mask = df["Número do processo"].astype(str) == str(args.contrato_processo)
        if not mask.any():
            raise ValueError(
                f"Processo '{args.contrato_processo}' não encontrado em '{args.contratos_csv}'."
            )
        contrato = _normalizar_contrato(df.loc[mask].iloc[0].to_dict())
    elif args.interativo:
        df = _carregar_contratos_csv(args.contratos_csv)
        contrato = _normalizar_contrato(_selecionar_contrato_interativo(df))
    else:
        contrato = _normalizar_contrato(DEFAULT_CONTRATO.copy())

    return contrato


def _treinar_modelo_vitoria(
    *,
    input_file: str,
    sheet: str,
    model_file: str,
    target_mode: str,
    positive_label: str,
    micro_mapping: dict,
    categorical_encoding: str,
    penalidade_por_subsidio: float,
    exclude_resultado_micro: str,
    max_train_rows: int,
    random_state: int,
) -> Dict[str, Any]:
    df = _load_dataset(input_file, sheet)
    if exclude_resultado_micro:
        if "Resultado micro" not in df.columns:
            raise KeyError("Coluna 'Resultado micro' não encontrada para aplicar o filtro solicitado.")
        mask_exclude = df["Resultado micro"].astype(str).str.strip() == str(exclude_resultado_micro).strip()
        df = df.loc[~mask_exclude].reset_index(drop=True)

    df = _add_quantidade_subsidios(df)

    target_col = "Resultado macro" if target_mode == "vitoria_macro" else "Resultado micro"
    categorical_cols = ["Sub-assunto"]
    numeric_cols = ["Valor da causa"]

    X, y = _prepare_xy(
        df,
        target_col=target_col,
        positive_label=positive_label,
        target_mode=target_mode,
        micro_mapping=micro_mapping,
        categorical_cols=categorical_cols,
        numeric_cols=numeric_cols,
    )

    chunk_size = int(max_train_rows) if max_train_rows and max_train_rows > 0 else len(X)
    chunk_size = max(1, chunk_size)

    pipelines = []
    if len(X) > chunk_size:
        # Usa todo o dataset treinando vários GPs menores (mixture/ensemble de especialistas).
        # Isso evita estouro de memória do GP único e preserva o uso do algoritmo GP.
        n_chunks = int(ceil(len(X) / chunk_size))
        rng = np.random.default_rng(random_state)
        all_idx = np.arange(len(X))
        rng.shuffle(all_idx)

        if target_mode == "vitoria_macro":
            pos_idx = all_idx[y[all_idx] >= 0.5]
            neg_idx = all_idx[y[all_idx] < 0.5]
            chunk_lists = [[] for _ in range(n_chunks)]

            for i, idx in enumerate(pos_idx):
                chunk_lists[i % n_chunks].append(int(idx))
            for i, idx in enumerate(neg_idx):
                chunk_lists[i % n_chunks].append(int(idx))

            chunk_indices = []
            for items in chunk_lists:
                if not items:
                    continue
                arr = np.array(items, dtype=int)
                rng.shuffle(arr)
                chunk_indices.append(arr)
        else:
            chunk_indices = [all_idx[i : i + chunk_size] for i in range(0, len(all_idx), chunk_size)]

        for idx_chunk in chunk_indices:
            X_fit = X.iloc[idx_chunk]
            y_fit = y[idx_chunk]
            pipe = _build_pipeline(
                categorical_cols,
                numeric_cols,
                categorical_encoding=categorical_encoding,
            )
            pipe.fit(X_fit, y_fit)
            pipelines.append(pipe)
    else:
        pipe = _build_pipeline(
            categorical_cols,
            numeric_cols,
            categorical_encoding=categorical_encoding,
        )
        pipe.fit(X, y)
        pipelines.append(pipe)

    payload = {
        "pipeline": pipelines[0],
        "pipelines": pipelines,
        "ensemble_size": int(len(pipelines)),
        "chunk_size": int(chunk_size),
        "n_rows_total": int(len(X)),
        "target_mode": target_mode,
        "features_categorical": categorical_cols,
        "features_numeric": numeric_cols,
        "subsidio_columns": SUBSIDIO_COLUMNS,
        "penalidade_por_subsidio": float(penalidade_por_subsidio),
    }

    os.makedirs(os.path.dirname(model_file) or ".", exist_ok=True)
    joblib.dump(payload, model_file)
    return payload


def _carregar_modelo(model_file: str) -> Dict[str, Any]:
    raw = joblib.load(model_file)
    if isinstance(raw, dict) and ("pipeline" in raw or "pipelines" in raw):
        payload = raw
    else:
        payload = {
            "pipeline": raw,
            "pipelines": [raw],
            "ensemble_size": 1,
            "chunk_size": None,
            "n_rows_total": None,
            "target_mode": "vitoria_macro",
            "features_categorical": ["Sub-assunto"],
            "features_numeric": ["Valor da causa"],
            "subsidio_columns": SUBSIDIO_COLUMNS,
        }

    if "pipelines" not in payload:
        payload["pipelines"] = [payload["pipeline"]] if payload.get("pipeline") is not None else []

    payload.setdefault("target_mode", "vitoria_macro")
    payload.setdefault("features_categorical", ["Sub-assunto"])
    payload.setdefault("features_numeric", ["Valor da causa"])
    payload.setdefault("subsidio_columns", SUBSIDIO_COLUMNS)
    payload.setdefault("penalidade_por_subsidio", 0.10)
    payload.setdefault("ensemble_size", len(payload.get("pipelines", [])) or 1)
    return payload


def _prever_chance_vitoria(model_payload: Dict[str, Any], contrato: Dict[str, Any]) -> Tuple[float, float]:
    categorias = list(model_payload["features_categorical"])
    numericas = list(model_payload["features_numeric"])
    target_mode = str(model_payload["target_mode"])
    subsidios = list(model_payload["subsidio_columns"])

    contrato_row = dict(contrato)
    for col in subsidios:
        contrato_row[col] = contrato_row.get(col, 0)

    faltantes = [c for c in categorias + ["Valor da causa"] if c not in contrato_row]
    if faltantes:
        raise KeyError(f"Contrato novo sem campos obrigatórios: {faltantes}")

    one = pd.DataFrame([contrato_row])
    one = _add_quantidade_subsidios(one)

    X_new = one[categorias + numericas].copy()
    for c in numericas:
        X_new[c] = pd.to_numeric(X_new[c], errors="coerce")
    X_new = X_new.fillna(0)

    pipelines = [p for p in model_payload.get("pipelines", []) if p is not None]
    if not pipelines:
        pipeline = model_payload.get("pipeline")
        if pipeline is None:
            raise ValueError("Modelo carregado sem pipeline para inferência.")
        pipelines = [pipeline]

    taxas = []
    stds = []
    for pipe in pipelines:
        proba, std = _predict_proba_with_uncertainty(pipe, X_new)
        taxas.append(float(_to_taxa_vitoria(proba, target_mode)[0]))
        stds.append(float(std[0]))

    taxa_vitoria_base = np.array([float(np.mean(taxas))], dtype=float)
    qtd_subsidios = pd.to_numeric(one["quantidade_subsidios"], errors="coerce").fillna(0.0).to_numpy()
    taxa_vitoria = float(
        _aplicar_regra_subsidios(
            taxa_vitoria_base,
            qtd_subsidios,
            float(model_payload.get("penalidade_por_subsidio", 0.10)),
        )[0]
    )
    incerteza = float(np.sqrt(np.mean(np.square(stds))))
    return taxa_vitoria, incerteza


def _float_or_error(value: Any, field_name: str) -> float:
    out = pd.to_numeric(pd.Series([value]), errors="coerce").iloc[0]
    if pd.isna(out):
        raise ValueError(f"Campo '{field_name}' inválido ou ausente: {value}")
    return float(out)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Analisa contrato novo: chance de vitória -> valor de acordo -> decisão acordo vs defesa."
        )
    )

    parser.add_argument("--contrato-json", default=None, help="JSON do contrato novo em linha única.")
    parser.add_argument("--contrato-json-file", default=None, help="Caminho para arquivo JSON do contrato novo.")
    parser.add_argument(
        "--contratos-csv",
        default=os.path.join("db", "processed", "processos_em_andamento.csv"),
        help="CSV com contratos para seleção por índice/processo.",
    )
    parser.add_argument(
        "--contrato-indice",
        type=int,
        default=None,
        help="Seleciona o contrato pela posição no --contratos-csv.",
    )
    parser.add_argument(
        "--contrato-processo",
        default=None,
        help="Seleciona o contrato pelo 'Número do processo' no --contratos-csv.",
    )
    parser.add_argument(
        "--interativo",
        action="store_true",
        help="Mostra lista de contratos do CSV e pede o índice no terminal.",
    )
    parser.add_argument(
        "--listar-contratos",
        action="store_true",
        help="Lista os contratos do CSV e encerra sem analisar.",
    )
    parser.add_argument(
        "--listar-contratos-json",
        action="store_true",
        help="Lista os contratos do CSV em JSON e encerra sem analisar.",
    )

    parser.add_argument(
        "--model-file",
        default=os.path.join("db", "processed", "gp_vitoria_model.joblib"),
        help="Modelo treinado de vitória (.joblib).",
    )
    parser.add_argument(
        "--train-file",
        default=os.path.join("db", "raw", "Hackaton_Enter_Base_Candidatos.csv"),
        help="Base de treino para fallback caso o modelo não exista.",
    )
    parser.add_argument("--sheet", default="merge_excel")
    parser.add_argument("--train-if-missing", action="store_true", help="Treina modelo se --model-file não existir.")
    parser.add_argument("--force-retrain", action="store_true", help="Ignora modelo salvo e treina novamente.")

    parser.add_argument("--target-mode", default="vitoria_macro", choices=["vitoria_macro", "severidade_micro"])
    parser.add_argument("--positive-label", default="Não Êxito")
    parser.add_argument(
        "--micro-mapping",
        default='{"Improcedência": 0, "Parcial procedência": 0.5, "Procedência": 1, "Acordo": 0.5}',
    )
    parser.add_argument("--categorical-encoding", default="ordinal", choices=["ordinal", "onehot"])
    parser.add_argument(
        "--penalidade-por-subsidio",
        type=float,
        default=0.10,
        help=(
            "Penalidade multiplicativa aplicada à chance de vitória para cada subsídio. "
            "Exemplo: 0.10 reduz 10% da chance por subsídio."
        ),
    )
    # Compatibilidade com comandos antigos (mantido sem efeito direto).
    parser.add_argument("--quantidade-subsidios-weight", type=float, default=None, help=argparse.SUPPRESS)
    parser.add_argument("--exclude-resultado-micro", default="Extinção")
    parser.add_argument(
        "--max-train-rows",
        type=int,
        default=5000,
        help=(
            "Tamanho máximo por GP especialista. "
            "Se a base for maior, o sistema treina ensemble de GPs para usar todos os dados."
        ),
    )
    parser.add_argument("--random-state", type=int, default=42)

    parser.add_argument("--alpha", type=float, default=0.7)
    parser.add_argument("--k-base", type=float, default=10.0)
    parser.add_argument("--c-extra-fixed", type=float, default=1000.0)
    parser.add_argument("--c-extra-ratio", type=float, default=0.0)
    parser.add_argument("--min-offer-frac", type=float, default=0.05)
    parser.add_argument("--max-offer-frac", type=float, default=1.0)
    parser.add_argument("--x0-frac", type=float, default=0.5)

    parser.add_argument(
        "--custo-defesa",
        type=float,
        default=7000.0,
        help="Custo esperado para seguir litigando sem acordo.",
    )
    parser.add_argument(
        "--output",
        default="resumo",
        choices=["resumo", "valor_acordo", "completo"],
        help="Formato da saída: resumo objetivo (padrão), só valor justo, ou relatório completo.",
    )

    args = parser.parse_args()

    if args.listar_contratos:
        df = _carregar_contratos_csv(args.contratos_csv)
        print("\n".join(_listar_contratos(df)))
        return 0
    if args.listar_contratos_json:
        df = _carregar_contratos_csv(args.contratos_csv)
        print(json.dumps(_listar_contratos_json(df), ensure_ascii=False))
        return 0

    contrato = _carregar_contrato(args)

    model_source = "arquivo"
    if (not os.path.exists(args.model_file)) or args.force_retrain:
        if not args.train_if_missing and not args.force_retrain:
            raise FileNotFoundError(
                f"Modelo não encontrado em '{args.model_file}'. Rode o treino com --model-out ou use --train-if-missing."
            )

        micro_mapping = json.loads(args.micro_mapping)
        model_payload = _treinar_modelo_vitoria(
            input_file=args.train_file,
            sheet=args.sheet,
            model_file=args.model_file,
            target_mode=args.target_mode,
            positive_label=args.positive_label,
            micro_mapping=micro_mapping,
            categorical_encoding=args.categorical_encoding,
            penalidade_por_subsidio=args.penalidade_por_subsidio,
            exclude_resultado_micro=args.exclude_resultado_micro,
            max_train_rows=args.max_train_rows,
            random_state=args.random_state,
        )
        model_source = "treinado_no_momento"
    else:
        model_payload = _carregar_modelo(args.model_file)

    taxa_vitoria, incerteza = _prever_chance_vitoria(model_payload, contrato)
    valor_da_causa = _float_or_error(contrato.get("Valor da causa"), "Valor da causa")

    valor_acordo, prob_aceite, custo_total_esperado, valor_esperado_perda = _otimizar_um_caso(
        valor_pedido=valor_da_causa,
        chance_vitoria=taxa_vitoria,
        c_extra_fixed=args.c_extra_fixed,
        c_extra_ratio=args.c_extra_ratio,
        alpha=args.alpha,
        k_base=args.k_base,
        min_offer_frac=args.min_offer_frac,
        max_offer_frac=args.max_offer_frac,
        x0_frac=args.x0_frac,
    )

    custo_esperado_defesa = valor_esperado_perda + float(args.custo_defesa)
    economia_acordo = custo_esperado_defesa - custo_total_esperado
    vale_pena_acordo = bool(economia_acordo > 0)
    recomendacao = "Buscar acordo" if vale_pena_acordo else "Ir para defesa"

    report = AnaliseReport(
        status="success",
        model_source=model_source,
        model_file=args.model_file,
        chance_vitoria=float(np.clip(taxa_vitoria, 0.0, 1.0)),
        incerteza=max(float(incerteza), 0.0),
        chance_vitoria_percentual=float(np.clip(taxa_vitoria * 100.0, 0.0, 100.0)),
        valor_da_causa=valor_da_causa,
        valor_esperado_perda=float(valor_esperado_perda),
        valor_acordo_proposto=float(valor_acordo),
        probabilidade_aceite=float(np.clip(prob_aceite, 0.0, 1.0)),
        custo_total_esperado_acordo=float(custo_total_esperado),
        custo_esperado_defesa=float(custo_esperado_defesa),
        economia_esperada_com_acordo=float(economia_acordo),
        vale_pena_acordo=vale_pena_acordo,
        recomendacao=recomendacao,
        contrato_analisado=contrato,
    )

    if args.output == "resumo":
        print(
            json.dumps(
                {
                    "taxa_probabilidade_vitoria": round(float(np.clip(taxa_vitoria * 100.0, 0.0, 100.0)), 2),
                    "fazer_acordo": vale_pena_acordo,
                    "valor_acordo_justo": float(valor_acordo) if vale_pena_acordo else None,
                },
                ensure_ascii=False,
            )
        )
    elif args.output == "valor_acordo":
        print(
            json.dumps(
                {
                    "status": "success",
                    "valor_acordo_justo": float(valor_acordo),
                },
                ensure_ascii=False,
            )
        )
    else:
        print(json.dumps(asdict(report), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))
        raise SystemExit(1)
