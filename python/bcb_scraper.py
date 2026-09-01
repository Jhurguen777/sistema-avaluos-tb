"""
Scraper BCB - Tipo de cambio oficial
Extrae el tipo de cambio oficial (Bs por USD) de la portada del Banco
Central de Bolivia (https://www.bcb.gob.bo/) y lo imprime como "TASA:<valor>"
para que el server action lo parsee. No guarda archivos.
"""

import re
import sys

import requests

URL_BCB = "https://www.bcb.gob.bo/"


def main():
    try:
        response = requests.get(
            URL_BCB,
            timeout=60,
            headers={"User-Agent": "Mozilla/5.0 (compatible; GeoPricerAvaluos/1.0)"},
        )
        response.raise_for_status()
    except Exception as e:
        print(f"ERROR: No se pudo acceder al BCB: {e}", file=sys.stderr)
        sys.exit(1)

    html = response.text

    # 1) Marcador principal: tarjeta "Tipo de cambio oficial" de la portada
    m = re.search(r'bcb-tco-num">\s*(\d{1,3}[.,]\d{2,4})\s*<', html)

    # 2) Fallback: primer numero decimal tras el titulo "Tipo de cambio oficial"
    if not m:
        m = re.search(
            r"Tipo\s+de\s+cambio\s+oficial.{0,600}?(\d{1,3}[.,]\d{2,4})",
            html,
            re.IGNORECASE | re.DOTALL,
        )

    if not m:
        print("ERROR: No se encontro el tipo de cambio en la pagina del BCB", file=sys.stderr)
        sys.exit(1)

    tasa_str = m.group(1).replace(",", ".")
    try:
        tasa = float(tasa_str)
    except ValueError:
        print(f"ERROR: Valor no numerico: {tasa_str}", file=sys.stderr)
        sys.exit(1)

    # Rango razonable para Bs/USD (defensivo ante cambios del HTML del BCB)
    if not (0.5 <= tasa <= 1000):
        print(f"ERROR: Tasa fuera de rango razonable: {tasa}", file=sys.stderr)
        sys.exit(1)

    print(f"TASA:{tasa:.2f}")


if __name__ == "__main__":
    main()
