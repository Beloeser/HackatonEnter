import argparse
import json
import os
from dataclasses import asdict, dataclass
from typing import List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel as C, WhiteKernel
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder, StandardScaler


@dataclass
class TrainReport:
    status: str
    model_path: str
    n_rows_total: int
    n_rows_filtered_out: int
    n_rows_used: int
    random_state: int
    test_size: float
    features_categorical: List[str]
    features_numeric: List[str]
    target_column: str
    positive_label: str
    excluded_resultado_micro: str
    target_mode: str
    micro_mapping: dict
    metrics: dict


def _load_dataset(path: str, sheet: str) -> pd.DataFrame:
    return pd.read_excel(path, sheet_name=sheet, engine="openpyxl")


# Colunas binárias de subsídio na planilha merge; a feature usada no modelo é só a soma.
SUBSIDIO_COLUMNS = [
    "Contrato",
    "Extrato",
    "Comprovante de crédito",
    "Dossiê",
    "Demonstrativo de evolução da dívida",
    "Laudo referenciado",
]


def _add_quantidade_subsidios(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    missing = [c for c in SUBSIDIO_COLUMNS if c not in out.columns]
    if missing:
        raise KeyError(f"Colunas de subsídio ausentes para contar: {missing}")
    mat = out[SUBSIDIO_COLUMNS].apply(pd.to_numeric, errors="coerce").fillna(0)
    # conta quantos subsídios foram fornecidos (1); soma dos bits = total
    out["quantidade_subsidios"] = mat.sum(axis=1).astype(int)
    return out


def _prepare_xy(
    df: pd.DataFrame,
    *,
    target_col: str,
    positive_label: str,
    target_mode: str,
    micro_mapping: dict,
    categorical_cols: List[str],
    numeric_cols: List[str],
) -> Tuple[pd.DataFrame, np.ndarray]:
    missing = [c for c in (categorical_cols + numeric_cols + [target_col]) if c not in df.columns]
    if missing:
        raise KeyError(f"Colunas ausentes: {missing}. Colunas disponíveis: {list(df.columns)}")

    if target_mode == "vitoria_macro":
        # target binário: vitória nossa = (Resultado macro == positive_label)
        y = (df[target_col].astype(str).str.strip() == positive_label).astype(float).to_numpy()
    elif target_mode == "severidade_micro":
        # target contínuo: 0 = vitória, 0.5 = derrota parcial, 1 = derrota total
        micro = df[target_col].astype(str).str.strip()
        y = micro.map(micro_mapping).astype(float).to_numpy()
        if np.isnan(y).any():
            unknown = sorted(set(micro[~micro.isin(list(micro_mapping.keys()))].unique().tolist()))
            raise ValueError(
                f"Há valores de '{target_col}' sem mapeamento: {unknown}. "
                f"Ajuste --micro-mapping."
            )
    else:
        raise ValueError("--target-mode inválido. Use 'vitoria_macro' ou 'severidade_micro'.")

    X = df[categorical_cols + numeric_cols].copy()
    for c in numeric_cols:
        X[c] = pd.to_numeric(X[c], errors="coerce")
    X = X.fillna(0)
    return X, y


def _build_pipeline(
    categorical_cols: List[str], numeric_cols: List[str], *, categorical_encoding: str
) -> Pipeline:
    if categorical_encoding not in {"ordinal", "onehot"}:
        raise ValueError("--categorical-encoding deve ser 'ordinal' ou 'onehot'")

    if categorical_encoding == "ordinal":
        cat_transformer = Pipeline(
            [
                (
                    "ordinal",
                    OrdinalEncoder(
                        handle_unknown="use_encoded_value",
                        unknown_value=-1,
                    ),
                ),
                ("scaler", StandardScaler()),
            ]
        )
    else:
        # Mantido para compatibilidade/experimentos, mas o default do projeto agora é ordinal.
        from sklearn.preprocessing import OneHotEncoder

        cat_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    pre = ColumnTransformer(
        transformers=[
            (
                "cat",
                cat_transformer,
                categorical_cols,
            ),
            ("num", Pipeline([("scaler", StandardScaler())]), numeric_cols),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    # GP "puro" não escala para dezenas de milhares de linhas. Este modelo é pensado para
    # treinar em uma amostra (configurável) e devolver média + desvio padrão (incerteza).
    kernel = C(1.0, (1e-2, 1e2)) * RBF(length_scale=1.0, length_scale_bounds=(1e-2, 1e2)) + WhiteKernel(
        noise_level=1e-3, noise_level_bounds=(1e-6, 1e-1)
    )
    gpr = GaussianProcessRegressor(
        kernel=kernel,
        normalize_y=True,
        random_state=0,
        alpha=1e-6,
    )

    return Pipeline([("pre", pre), ("gpr", gpr)])


def _predict_proba_with_uncertainty(pipe: Pipeline, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    mean, std = pipe.predict(X, return_std=True)
    proba = np.clip(mean, 0.0, 1.0)
    return proba, std


def main() -> int:
    parser = argparse.ArgumentParser(description="Treina GP para chance de vitória (Êxito).")
    parser.add_argument("--input-xlsx", default=os.path.join("db", "merge_excel.xlsx"))
    parser.add_argument("--sheet", default="merge_excel")
    parser.add_argument("--model-out", default=os.path.join("backend", "ml", "models", "gp_vitoria.joblib"))
    parser.add_argument(
        "--target-mode",
        default="severidade_micro",
        choices=["vitoria_macro", "severidade_micro"],
        help=(
            "Tipo de alvo. 'severidade_micro' aprende: 0=Improcedência, 0.5=Parcial procedência, 1=Procedência. "
            "'vitoria_macro' mantém o binário no Resultado macro."
        ),
    )
    parser.add_argument("--target-col", default="Resultado micro")
    # Para vitoria_macro: nesta base, 'Êxito' é êxito do oponente. Vitória nossa = 'Não Êxito'.
    parser.add_argument("--positive-label", default="Não Êxito")
    parser.add_argument(
        "--micro-mapping",
        default='{"Improcedência": 0, "Parcial procedência": 0.5, "Procedência": 1, "Acordo": 0.5}',
        help="JSON com mapeamento de Resultado micro -> número (usado em severidade_micro).",
    )
    parser.add_argument(
        "--categorical-encoding",
        default="ordinal",
        choices=["ordinal", "onehot"],
        help="Como transformar texto em número. 'ordinal' evita colunas binárias (one-hot).",
    )
    parser.add_argument(
        "--exclude-resultado-micro",
        default="Extinção",
        help="Remove do treino/validação todas as linhas cujo Resultado micro seja este valor.",
    )
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument(
        "--max-train-rows",
        type=int,
        default=5000,
        help="Limite de linhas para treinar o GP (por performance). Use 0 para usar tudo (pode ser impraticável).",
    )
    args = parser.parse_args()
    micro_mapping = json.loads(args.micro_mapping)

    df = _load_dataset(args.input_xlsx, args.sheet)
    n_total = int(len(df))
    n_filtered_out = 0
    if args.exclude_resultado_micro:
        if "Resultado micro" not in df.columns:
            raise KeyError("Coluna 'Resultado micro' não encontrada para aplicar o filtro solicitado.")
        mask_exclude = df["Resultado micro"].astype(str).str.strip() == str(args.exclude_resultado_micro).strip()
        n_filtered_out = int(mask_exclude.sum())
        df = df.loc[~mask_exclude].reset_index(drop=True)

    # Features: subsídios entram só como quantidade total (soma dos bits), não coluna a coluna.
    df = _add_quantidade_subsidios(df)

    categorical_cols = ["Sub-assunto"]
    numeric_cols = [
        "Valor da causa",
        "quantidade_subsidios",
    ]

    X, y = _prepare_xy(
        df,
        target_col=args.target_col,
        positive_label=args.positive_label,
        target_mode=args.target_mode,
        micro_mapping=micro_mapping,
        categorical_cols=categorical_cols,
        numeric_cols=numeric_cols,
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.random_state, stratify=y
    )

    if args.max_train_rows and args.max_train_rows > 0 and len(X_train) > args.max_train_rows:
        rng = np.random.default_rng(args.random_state)
        idx = rng.choice(len(X_train), size=args.max_train_rows, replace=False)
        X_fit = X_train.iloc[idx]
        y_fit = y_train[idx]
    else:
        X_fit = X_train
        y_fit = y_train

    pipe = _build_pipeline(
        categorical_cols, numeric_cols, categorical_encoding=args.categorical_encoding
    )
    pipe.fit(X_fit, y_fit)

    proba, std = _predict_proba_with_uncertainty(pipe, X_test)
    metrics = {"mean_std": float(np.mean(std))}
    if args.target_mode == "vitoria_macro":
        y_pred = (proba >= 0.5).astype(float)
        metrics.update(
            {
                "roc_auc": float(roc_auc_score(y_test, proba)),
                "accuracy@0.5": float(accuracy_score(y_test, y_pred)),
                "brier": float(brier_score_loss(y_test, proba)),
            }
        )
    else:
        # severidade_micro: não é classificação; métricas de calibração/erro simples
        mse = float(np.mean((proba - y_test) ** 2))
        mae = float(np.mean(np.abs(proba - y_test)))
        metrics.update({"mse": mse, "mae": mae})

    os.makedirs(os.path.dirname(args.model_out) or ".", exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipe,
            "categorical_cols": categorical_cols,
            "numeric_cols": numeric_cols,
            "subsidy_columns": SUBSIDIO_COLUMNS,
            "target_col": args.target_col,
            "positive_label": args.positive_label,
            "target_mode": args.target_mode,
            "micro_mapping": micro_mapping,
        },
        args.model_out,
    )

    report = TrainReport(
        status="success",
        model_path=args.model_out,
        n_rows_total=n_total,
        n_rows_filtered_out=n_filtered_out,
        n_rows_used=int(len(X_fit)),
        random_state=args.random_state,
        test_size=float(args.test_size),
        features_categorical=categorical_cols,
        features_numeric=numeric_cols,
        target_column=args.target_col,
        positive_label=args.positive_label,
        excluded_resultado_micro=str(args.exclude_resultado_micro),
        target_mode=str(args.target_mode),
        micro_mapping=micro_mapping,
        metrics=metrics,
    )

    print(json.dumps(asdict(report), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

