import argparse
import json
import os
import sys
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_MODEL = os.path.join(_SCRIPT_DIR, "models", "gp_vitoria.joblib")


def _load_model(model_path: str) -> Dict[str, Any]:
    obj = joblib.load(model_path)
    if "pipeline" not in obj:
        raise ValueError("Arquivo de modelo inválido: esperado dict com chave 'pipeline'.")
    return obj


def _row_from_json(
    payload: Dict[str, Any],
    categorical_cols,
    numeric_cols,
    subsidy_columns: list = None,
) -> pd.DataFrame:
    row = {}
    for c in categorical_cols:
        row[c] = payload.get(c)

    # quantidade_subsidios: explícito ou soma dos bits de subsídio
    if "quantidade_subsidios" in numeric_cols:
        q = payload.get("quantidade_subsidios")
        if q is None and subsidy_columns:
            q = sum(int(bool(payload.get(k, 0))) for k in subsidy_columns)
        row["quantidade_subsidios"] = int(q) if q is not None else 0

    for c in numeric_cols:
        if c == "quantidade_subsidios":
            continue
        row[c] = payload.get(c, 0)
    return pd.DataFrame([row])


def _predict(pipe, X: pd.DataFrame) -> Tuple[float, float]:
    mean, std = pipe.predict(X, return_std=True)
    p = float(np.clip(mean[0], 0.0, 1.0))
    s = float(std[0])
    return p, s


def main() -> int:
    parser = argparse.ArgumentParser(description="Prediz chance de vitória (Êxito) com GP.")
    parser.add_argument(
        "--model",
        default=_DEFAULT_MODEL,
        help="Caminho do modelo treinado (padrão: ml/models/gp_vitoria.joblib ao lado deste script).",
    )
    parser.add_argument(
        "--json",
        default=None,
        help="Payload JSON (string) com campos (UF, Assunto, Sub-assunto, Valor da causa, etc.).",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.model):
        print(
            json.dumps(
                {
                    "status": "error",
                    "message": f"Modelo não encontrado: {args.model}",
                    "hint": "O arquivo não vai no Git (é pesado). Treine localmente: "
                    "python backend/ml/train_vitoria_gp.py",
                },
                ensure_ascii=False,
            )
        )
        return 1

    model = _load_model(args.model)
    pipe = model["pipeline"]
    categorical_cols = model["categorical_cols"]
    numeric_cols = model["numeric_cols"]
    subsidy_columns = model.get("subsidy_columns")
    target_mode = model.get("target_mode")
    micro_mapping = model.get("micro_mapping")

    if args.json:
        payload = json.loads(args.json)
    else:
        payload = json.load(sys.stdin)

    X = _row_from_json(
        payload, categorical_cols, numeric_cols, subsidy_columns=subsidy_columns
    ).fillna(0)
    p, s = _predict(pipe, X)

    def _json_val(v):
        if hasattr(v, "item"):
            return v.item()
        return v

    used = {c: _json_val(X.iloc[0][c]) for c in (categorical_cols + numeric_cols)}

    out = {
        "status": "success",
        # p é sempre a predição do GP (média). O significado depende do modo de treino:
        # - vitoria_macro: probabilidade de vitória (classe positiva)
        # - severidade_micro: severidade esperada (0..1)
        "p_vitoria": p,
        "target_mode": target_mode,
        "sigma": s,
        "sigma_pp": s * 100.0,
        "interval_95": [max(0.0, p - 1.96 * s), min(1.0, p + 1.96 * s)],
        "interval_95_pp": [
            max(0.0, (p - 1.96 * s) * 100.0),
            min(100.0, (p + 1.96 * s) * 100.0),
        ],
        "positive_label": model.get("positive_label"),
        "micro_mapping": micro_mapping,
        "used_features": used,
    }
    print(json.dumps(out, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(
            json.dumps(
                {"status": "error", "message": str(e)},
                ensure_ascii=False,
            )
        )
        raise SystemExit(1)

