"""Recorte de fondo híbrido: unión de la máscara de un modelo con una máscara clásica por color.

El modelo (@imgly/background-removal-node) acierta con cajas blancas y reflejos; el color rescata cajas claras
o de colores que el modelo pierde; y un completado dentro del casco convexo recupera brillos casi blancos.

Uso (lo llama tools/recortar-fotos.mjs):
    python tools/lib/recorte_hibrido.py <foto-original> <salida-del-modelo.png> <salida.webp>

Imprime una línea JSON con métricas. Requiere: pip install pillow numpy scipy
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.spatial import ConvexHull

DIST_MIN = 34      # distancia mínima al fondo para contar como producto
UMBRAL_CASCO = 6   # sensibilidad del completado (casi blanco)
MARGEN_CASCO = 26  # cuánto mira más allá de la silueta detectada
ALTO_MAX = (640, 760)


def fondo_estimado(rgb):
    borde = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3), rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
    return np.median(borde, axis=0)


def mascara_color(rgb):
    dist = np.abs(rgb.astype(int) - fondo_estimado(rgb).astype(int)).max(axis=2)
    m = ndi.binary_closing(dist > DIST_MIN, structure=np.ones((5, 5)), iterations=2)
    return ndi.binary_fill_holes(m)


def mascara_modelo(alfa):
    m = ndi.binary_closing(alfa > 0.22, structure=np.ones((5, 5)), iterations=2)
    return ndi.binary_fill_holes(m)


def completar_con_casco(m, rgb):
    """Agrega lo casi blanco pegado al producto que cae dentro de su casco convexo (cajas blancas, vidrio)."""
    ys, xs = np.nonzero(m)
    if len(xs) < 50:
        return m
    base = ndi.binary_dilation(m, iterations=MARGEN_CASCO)
    ys, xs = np.nonzero(base)
    paso = max(1, len(xs) // 4000)
    pts = np.column_stack([xs[::paso], ys[::paso]])
    try:
        casco = ConvexHull(pts)
    except Exception:
        return m
    img = Image.new('L', (m.shape[1], m.shape[0]), 0)
    ImageDraw.Draw(img).polygon([tuple(pts[v]) for v in casco.vertices], fill=1)
    dentro = np.asarray(img).astype(bool)
    dist = np.abs(rgb.astype(int) - fondo_estimado(rgb).astype(int)).max(axis=2)
    sutil = ndi.binary_opening(dist > UMBRAL_CASCO, structure=np.ones((3, 3)))
    sutil = sutil & ndi.binary_dilation(m, iterations=max(40, MARGEN_CASCO)) & dentro
    m2 = ndi.binary_closing(m | sutil, structure=np.ones((9, 9)), iterations=2)
    return ndi.binary_fill_holes(m2)


def recortar(original, modelo, salida):
    orig = Image.open(original).convert('RGB')
    rec = Image.open(modelo).convert('RGBA').resize(orig.size)
    rgb = np.asarray(orig)
    alfa = np.asarray(rec)[..., 3].astype(np.float32) / 255.0

    m = mascara_modelo(alfa) | mascara_color(rgb)
    m = ndi.binary_fill_holes(ndi.binary_closing(m, structure=np.ones((7, 7)), iterations=2))
    etiquetas, n = ndi.label(m)
    if n:
        tam = ndi.sum(m, etiquetas, range(1, n + 1))
        m = np.isin(etiquetas, [k + 1 for k, t in enumerate(tam) if t >= 0.03 * tam.max()])
    m = completar_con_casco(m, rgb)
    m = ndi.binary_erosion(m, iterations=1)

    suave = np.clip((ndi.gaussian_filter(m.astype(np.float32), 0.9) - 0.15) / 0.7, 0, 1)
    borde = (suave > 0) & (suave < 1)
    rgb2 = rgb.astype(np.float32)
    rgb2[borde] *= 0.55 + 0.45 * suave[borde, None]  # saca el halo blanco del borde
    img = Image.fromarray(np.dstack([rgb2.clip(0, 255), suave * 255]).astype(np.uint8), 'RGBA')
    caja = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if caja:
        img = img.crop(caja)
    img.thumbnail(ALTO_MAX)
    img.save(salida, 'WEBP', quality=86, method=6)

    # Métrica: qué parte de lo que se aparta del fondo quedó dentro del recorte (solo orientativa).
    dif = ndi.binary_fill_holes(ndi.binary_closing(np.abs(rgb.astype(int) - fondo_estimado(rgb).astype(int)).max(axis=2) > 28, structure=np.ones((5, 5)), iterations=2))
    cobertura = float((m & dif).sum() / max(1, dif.sum()))
    return {'cobertura': round(cobertura, 3), 'ocupacion': round(float(m.sum() / m.size), 3)}


if __name__ == '__main__':
    print(json.dumps(recortar(sys.argv[1], sys.argv[2], sys.argv[3])))
