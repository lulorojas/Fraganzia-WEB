"""Junta el recorte de una caja y el de un frasco (de dos fotos reales del mismo perfume) en una sola imagen:
la caja atrás a la izquierda y el frasco adelante a la derecha, apoyados en la misma línea.

Uso (lo llama tools/recortar-fotos.mjs):
    python tools/lib/componer.py <caja.webp> <frasco.webp> <salida.webp> [escala-del-frasco]

escala-del-frasco: alto del frasco como fracción del alto de la caja (0,8 por defecto; ajustarla por perfume
si el frasco real es más alto o más bajo que su caja). Imprime una línea JSON. Requiere: pip install pillow
"""
import json
import sys

from PIL import Image

ALTO_MAX = (640, 760)
SUPERPOSICION = 0.14  # cuánto del ancho del frasco tapa a la caja


def componer(caja_png, frasco_png, salida, escala=0.8):
    caja = Image.open(caja_png).convert('RGBA')
    frasco = Image.open(frasco_png).convert('RGBA')
    alto_caja = caja.height
    alto_frasco = max(1, round(alto_caja * escala))
    frasco = frasco.resize((max(1, round(frasco.width * alto_frasco / frasco.height)), alto_frasco), Image.LANCZOS)

    x_frasco = caja.width - round(frasco.width * SUPERPOSICION)
    ancho = x_frasco + frasco.width
    lienzo = Image.new('RGBA', (ancho, alto_caja), (0, 0, 0, 0))
    lienzo.alpha_composite(caja, (0, 0))
    lienzo.alpha_composite(frasco, (x_frasco, alto_caja - alto_frasco))

    pre = lienzo.convert('RGBa')
    pre.thumbnail(ALTO_MAX, Image.LANCZOS)
    pre.convert('RGBA').save(salida, 'WEBP', quality=88, method=6)
    return {'ancho': pre.width, 'alto': pre.height}


if __name__ == '__main__':
    escala = float(sys.argv[4]) if len(sys.argv) > 4 else 0.8
    print(json.dumps(componer(sys.argv[1], sys.argv[2], sys.argv[3], escala)))
