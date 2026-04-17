import argparse
import json
import os
import sys
from typing import Optional, Tuple

import pandas as pd


def _find_key_column(df: pd.DataFrame, key: str) -> str:
    if key in df.columns:
        return key
    lowered = {str(c).strip().lower(): c for c in df.columns}
    if key.strip().lower() in lowered:
        return lowered[key.strip().lower()]
    raise KeyError(
        f"Coluna-chave '{key}' não encontrada. Colunas disponíveis: {list(df.columns)}"
    )

def _key_variants(key: str) -> list:
    k = key.strip()
    variants = [k]
    # tenta variação singular/plural simples (processo vs processos)
    if k.lower().endswith("s"):
        variants.append(k[:-1])
    else:
        variants.append(k + "s")
    # tenta normalizar espaços
    variants.append(" ".join(k.split()))
    return list(dict.fromkeys(variants))

def _resolve_key(df: pd.DataFrame, key: str) -> str:
    last_err = None
    for candidate in _key_variants(key):
        try:
            return _find_key_column(df, candidate)
        except KeyError as e:
            last_err = e
    if last_err:
        raise last_err
    raise KeyError(f"Coluna-chave '{key}' não encontrada.")


def _read_sheet(path: str, sheet: str) -> pd.DataFrame:
    """
    Lê uma aba do Excel.

    Alguns arquivos têm uma primeira linha "legenda" (ex.: '1 = ... / 0 = ...') e o cabeçalho real
    começa na segunda linha. Detectamos esse caso e ajustamos automaticamente.
    """
    preview = pd.read_excel(
        path, sheet_name=sheet, engine="openpyxl", header=None, nrows=2
    )
    first_cell = (
        str(preview.iat[0, 0]).strip().lower() if preview.shape[0] > 0 else ""
    )
    header_row = 1 if ("subsídio" in first_cell or "subsidio" in first_cell) else 0
    return pd.read_excel(path, sheet_name=sheet, engine="openpyxl", header=header_row)


def _load_inputs(
    *,
    input_file: Optional[str],
    subsidios_file: Optional[str],
    resultados_file: Optional[str],
    subsidios_sheet: str,
    resultados_sheet: str,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if input_file:
        subsidios_df = _read_sheet(input_file, subsidios_sheet)
        resultados_df = _read_sheet(input_file, resultados_sheet)
        return subsidios_df, resultados_df

    if subsidios_file and resultados_file:
        subsidios_df = pd.read_excel(subsidios_file, engine="openpyxl")
        resultados_df = pd.read_excel(resultados_file, engine="openpyxl")
        return subsidios_df, resultados_df

    raise ValueError(
        "Informe --input-file (com duas abas) OU --subsidios-file e --resultados-file (dois arquivos)."
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Une dados de 'Subsídios' e 'Resultados' por número do processo."
    )
    parser.add_argument(
        "--input-file",
        default=None,
        help="Arquivo .xlsx com duas abas (subsídios e resultados).",
    )
    parser.add_argument(
        "--subsidios-file",
        default=None,
        help="Arquivo .xlsx contendo apenas a planilha/tabela de subsídios.",
    )
    parser.add_argument(
        "--resultados-file",
        default=None,
        help="Arquivo .xlsx contendo apenas a planilha/tabela de resultados.",
    )
    parser.add_argument(
        "--subsidios-sheet",
        default="Subsídios disponibilizados",
        help="Nome da aba de subsídios dentro do --input-file.",
    )
    parser.add_argument(
        "--resultados-sheet",
        default="Resultados dos processos",
        help="Nome da aba de resultados dentro do --input-file.",
    )
    parser.add_argument(
        "--key",
        default="Número do processo",
        help="Nome da coluna-chave (número do processo) para fazer a junção.",
    )
    parser.add_argument(
        "--subsidios-key",
        default=None,
        help="Coluna-chave especificamente na planilha de subsídios (opcional).",
    )
    parser.add_argument(
        "--resultados-key",
        default=None,
        help="Coluna-chave especificamente na planilha de resultados (opcional).",
    )
    parser.add_argument(
        "--how",
        default="left",
        choices=["left", "inner", "right", "outer"],
        help="Tipo de junção (igual ao merge do pandas).",
    )
    parser.add_argument(
        "--output-file",
        default=os.path.join("db", "processed", "merge_excel.xlsx"),
        help="Caminho do .xlsx de saída.",
    )
    args = parser.parse_args()

    subsidios_df, resultados_df = _load_inputs(
        input_file=args.input_file,
        subsidios_file=args.subsidios_file,
        resultados_file=args.resultados_file,
        subsidios_sheet=args.subsidios_sheet,
        resultados_sheet=args.resultados_sheet,
    )

    subsidios_key = _resolve_key(subsidios_df, args.subsidios_key or args.key)
    resultados_key = _resolve_key(resultados_df, args.resultados_key or args.key)

    merged = subsidios_df.merge(
        resultados_df,
        left_on=subsidios_key,
        right_on=resultados_key,
        how=args.how,
        suffixes=("_subsidios", "_resultados"),
    )
    if subsidios_key != resultados_key:
        # mantém só uma coluna de identificador do processo
        merged = merged.drop(columns=[resultados_key])
        merged = merged.rename(columns={subsidios_key: args.key})

    os.makedirs(os.path.dirname(args.output_file) or ".", exist_ok=True)
    with pd.ExcelWriter(args.output_file, engine="openpyxl") as writer:
        # arquivo de saída com APENAS o merge, como solicitado
        merged.to_excel(writer, sheet_name="merge_excel", index=False)

    print(
        json.dumps(
            {
                "status": "success",
                "output_file": args.output_file,
                "rows_subsidios": int(len(subsidios_df)),
                "rows_resultados": int(len(resultados_df)),
                "rows_unificado": int(len(merged)),
                "key_subsidios": str(subsidios_key),
                "key_resultados": str(resultados_key),
                "how": args.how,
            }
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        raise SystemExit(1)

