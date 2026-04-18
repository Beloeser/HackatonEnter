import argparse
import json
import os
from dataclasses import asdict, dataclass
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from scipy.optimize import minimize


@dataclass
class TrainAcordoReport:
    status: str
    input_csv: str
    output_csv: str
    n_rows_total: int
    n_rows_used: int
    metrics: Dict[str, float]
    params: Dict[str, float]


def _sigmoid(x: float) -> float:
    return float(1.0 / (1.0 + np.exp(-x)))


def _probabilidade_aceite(
    s: float,
    valor_pedido: float,
    chance_vitoria: float,
    alpha: float,
    k_base: float,
) -> float:
    """
    p_aceite(S) = 1 / (1 + exp(-k * (S - alpha * E[V])))
    Com k escalado pelo valor pedido para manter estabilidade entre causas.
    """
    valor_esperado_perda = valor_pedido * (1.0 - chance_vitoria)
    k = k_base / max(valor_pedido, 1.0)
    z = k * (s - (alpha * valor_esperado_perda))
    return _sigmoid(z)


def _custo_total_esperado(
    s: float,
    valor_pedido: float,
    chance_vitoria: float,
    c_extra: float,
    alpha: float,
    k_base: float,
) -> float:
    p_aceite = _probabilidade_aceite(s, valor_pedido, chance_vitoria, alpha, k_base)
    valor_esperado_sentenca = valor_pedido * (1.0 - chance_vitoria)
    return float((p_aceite * s) + ((1.0 - p_aceite) * (valor_esperado_sentenca + c_extra)))


def _otimizar_um_caso(
    valor_pedido: float,
    chance_vitoria: float,
    *,
    c_extra_fixed: float,
    c_extra_ratio: float,
    alpha: float,
    k_base: float,
    min_offer_frac: float,
    max_offer_frac: float,
    x0_frac: float,
) -> Tuple[float, float, float, float]:
    v = float(max(valor_pedido, 0.0))
    p = float(np.clip(chance_vitoria, 0.0, 1.0))

    valor_esperado_perda = v * (1.0 - p)
    c_extra = c_extra_fixed + (c_extra_ratio * v)

    # Faixa de busca da proposta com restrição financeira
    low = min_offer_frac * v
    high = max_offer_frac * v
    high = min(high, valor_esperado_perda)
    low = max(0.0, min(low, high))

    if high <= 0.0:
        return 0.0, 0.0, valor_esperado_perda + c_extra, valor_esperado_perda

    x0 = float(np.clip(x0_frac * valor_esperado_perda, low, high))

    def obj(x_arr: np.ndarray) -> float:
        s = float(x_arr[0])
        return _custo_total_esperado(
            s=s,
            valor_pedido=v,
            chance_vitoria=p,
            c_extra=c_extra,
            alpha=alpha,
            k_base=k_base,
        )

    res = minimize(
        obj,
        x0=np.array([x0], dtype=float),
        bounds=[(low, high)],
        method="L-BFGS-B",
    )

    s_opt = float(np.clip(res.x[0], low, high)) if res.success else x0
    p_aceite_opt = _probabilidade_aceite(s_opt, v, p, alpha, k_base)
    ce_opt = _custo_total_esperado(s_opt, v, p, c_extra, alpha, k_base)
    return s_opt, p_aceite_opt, ce_opt, valor_esperado_perda


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Calcula valor de acordo ótimo por otimização de custo esperado (sem GP no acordo)."
    )
    parser.add_argument(
        "--input-csv",
        default=os.path.join("db", "processed", "gp_treino_resultados.csv"),
        help="CSV com ao menos: taxa_vitoria, valor_da_causa.",
    )
    parser.add_argument(
        "--output-csv",
        default=os.path.join("db", "processed", "gp_acordo_treino_resultados.csv"),
        help="CSV de saída com acordo proposto.",
    )

    # Parâmetros da função de custo
    parser.add_argument("--alpha", type=float, default=0.7)
    parser.add_argument("--k-base", type=float, default=10.0)
    parser.add_argument("--c-extra-fixed", type=float, default=1000.0)
    parser.add_argument("--c-extra-ratio", type=float, default=0.0)
    parser.add_argument("--min-offer-frac", type=float, default=0.05)
    parser.add_argument("--max-offer-frac", type=float, default=1.0)
    parser.add_argument("--x0-frac", type=float, default=0.5)
    args = parser.parse_args()

    df = pd.read_csv(args.input_csv)
    required = ["taxa_vitoria", "valor_da_causa"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise KeyError(
            f"Colunas obrigatórias ausentes em {args.input_csv}: {missing}. Esperado: {required}"
        )

    work = df.copy()
    work["taxa_vitoria"] = pd.to_numeric(work["taxa_vitoria"], errors="coerce")
    work["valor_da_causa"] = pd.to_numeric(work["valor_da_causa"], errors="coerce")
    work = work.dropna(subset=["taxa_vitoria", "valor_da_causa"]).reset_index(drop=True)
    work["taxa_vitoria"] = work["taxa_vitoria"].clip(0.0, 1.0)
    work["valor_da_causa"] = work["valor_da_causa"].clip(lower=0.0)

    optimized = work.apply(
        lambda r: _otimizar_um_caso(
            valor_pedido=float(r["valor_da_causa"]),
            chance_vitoria=float(r["taxa_vitoria"]),
            c_extra_fixed=args.c_extra_fixed,
            c_extra_ratio=args.c_extra_ratio,
            alpha=args.alpha,
            k_base=args.k_base,
            min_offer_frac=args.min_offer_frac,
            max_offer_frac=args.max_offer_frac,
            x0_frac=args.x0_frac,
        ),
        axis=1,
        result_type="expand",
    )
    optimized.columns = [
        "valor_acordo_proposto",
        "probabilidade_aceite",
        "custo_total_esperado",
        "valor_esperado_perda",
    ]

    out = pd.concat([work, optimized], axis=1)
    ordered_cols = [
        "numero_processo" if "numero_processo" in out.columns else None,
        "taxa_vitoria",
        "valor_da_causa",
        "valor_esperado_perda",
        "probabilidade_aceite",
        "custo_total_esperado",
        "valor_acordo_proposto",
    ]
    ordered_cols = [c for c in ordered_cols if c is not None]
    out = out[ordered_cols]

    os.makedirs(os.path.dirname(args.output_csv) or ".", exist_ok=True)
    out.to_csv(args.output_csv, index=False, encoding="utf-8-sig")

    report = TrainAcordoReport(
        status="success",
        input_csv=args.input_csv,
        output_csv=args.output_csv,
        n_rows_total=int(len(df)),
        n_rows_used=int(len(out)),
        metrics={
            "mean_probabilidade_aceite": float(out["probabilidade_aceite"].mean()),
            "mean_valor_acordo_proposto": float(out["valor_acordo_proposto"].mean()),
            "mean_custo_total_esperado": float(out["custo_total_esperado"].mean()),
        },
        params={
            "alpha": args.alpha,
            "k_base": args.k_base,
            "c_extra_fixed": args.c_extra_fixed,
            "c_extra_ratio": args.c_extra_ratio,
            "min_offer_frac": args.min_offer_frac,
            "max_offer_frac": args.max_offer_frac,
            "x0_frac": args.x0_frac,
        },
    )
    print(json.dumps(asdict(report), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))
        raise SystemExit(1)
