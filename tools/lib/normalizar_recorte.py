"""Deja todos los recortes del mismo tamaño y en la misma posición, sin tocar un solo píxel del producto.

Cada recorte se acomoda en un lienzo cuadrado fijo (LADO x LADO, transparente):
  - mismo tamaño a la vista: se escala para que el producto ocupe la misma superficie (ancho x alto) en todos,
    así un frasco solo y una caja con frasco se ven parejos (con la misma altura, las fotos anchas parecerían
    enormes; con el mismo ancho, las altas);
  - nunca se sale del lienzo: si una foto es muy alta o muy ancha, se achica hasta entrar con margen;
  - centrado y apoyado en la misma línea de piso: todas las cards quedan alineadas y simétricas.

Es idempotente: primero recorta al producto (lo no transparente), así se puede volver a correr sobre un recorte ya
normalizado y queda igual.

Uso: python tools/lib/normalizar_recorte.py <recorte.webp> [<recorte.webp> ...]   (reescribe cada archivo)
Requiere: pip install pillow
"""
import json
import math
import sys

from PIL import Image

LADO = 800
SUPERFICIE = 560  # lado del cuadrado de igual superficie: ancho x alto del producto = SUPERFICIE²
ANCHO_MAX = 0.96 * LADO
ALTO_MAX = 0.88 * LADO
PISO = 0.95 * LADO  # dónde se apoya la base del producto
UMBRAL_ALFA = 8  # píxeles casi transparentes (restos del recorte) no cuentan como producto


def normalizar(ruta):
    im = Image.open(ruta).convert('RGBA')
    caja = im.getchannel('A').point(lambda a: 255 if a > UMBRAL_ALFA else 0).getbbox()
    if not caja:
        return {'archivo': ruta, 'error': 'vacío'}
    producto = im.crop(caja)
    w, h = producto.size
    aspecto = w / h
    ancho, alto = SUPERFICIE * math.sqrt(aspecto), SUPERFICIE / math.sqrt(aspecto)
    escala = min(ancho / w, alto / h, ANCHO_MAX / w, ALTO_MAX / h)
    nuevo = (max(1, round(w * escala)), max(1, round(h * escala)))
    # Escalar con alfa premultiplicado: evita bordes oscuros o claros alrededor del producto.
    producto = producto.convert('RGBa').resize(nuevo, Image.LANCZOS).convert('RGBA')
    lienzo = Image.new('RGBA', (LADO, LADO), (0, 0, 0, 0))
    lienzo.alpha_composite(producto, (round((LADO - nuevo[0]) / 2), round(PISO - nuevo[1])))
    lienzo.save(ruta, 'WEBP', quality=88, method=4)
    return {'archivo': ruta, 'antes': [w, h], 'ahora': list(nuevo)}


if __name__ == '__main__':
    for r in sys.argv[1:]:
        print(json.dumps(normalizar(r)))
