"""Recorte de fondo híbrido: unión de la máscara de un modelo con una máscara clásica por color.

El modelo (@imgly/background-removal-node) acierta con cajas blancas y reflejos; el color rescata cajas claras
o de colores que el modelo pierde; y un completado dentro del casco convexo recupera brillos casi blancos.

Después se corrigen los dos defectos que se notan sobre el escenario oscuro:
  - restos del fondo blanco de estudio (huecos entre la caja y el frasco, esquinas): se quita el blanco puro que
    el modelo marcó como fondo, así el escenario se ve por esos huecos;
  - el halo de los bordes: el borde pasa a ser suave (transparencia continua) y toma el color del producto en
    vez del tono mezclado con el fondo.

Uso (lo llama tools/recortar-fotos.mjs):
    python tools/lib/recorte_hibrido.py <foto-original> <salida-del-modelo.png> <salida.webp> [--conservar-blanco] [--casco]

--conservar-blanco: no quita el blanco de estudio (para productos que son blancos, por ejemplo una caja blanca
sobre fondo blanco, donde quitarlo se llevaría también la caja).
--casco: cierra la silueta con su casco convexo (caja blanca sobre fondo blanco que la máscara deja a pedazos).
--cierre=N: rellena las mordidas del borde con un cierre morfológico de radio N px (más local que --casco; 40 a 100).

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
BLANCO_PURO = 247  # canal mínimo desde el cual un píxel cuenta como blanco de estudio
FONDO_MODELO = 0.12  # el modelo lo marcó como fondo si su transparencia es menor que esto
RESTO_MIN = 0.003  # un resto de fondo se quita si ocupa más de esta fracción de la imagen
BANDA = 6  # px del borde donde el color se reemplaza por el del interior


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


def quitar_blanco_de_fondo(m, rgb, alfa):
    """Saca de la máscara el blanco puro que el modelo consideró fondo (huecos entre objetos, esquinas)."""
    resto = m & (rgb.min(axis=2) >= BLANCO_PURO) & (alfa < FONDO_MODELO)
    resto = ndi.binary_opening(resto, structure=np.ones((3, 3)))
    et, n = ndi.label(resto)
    if not n:
        return m
    tam = ndi.sum(resto, et, range(1, n + 1))
    grandes = [k + 1 for k, t in enumerate(tam) if t >= RESTO_MIN * m.size]
    quitar = ndi.binary_dilation(np.isin(et, grandes), iterations=2) & (rgb.min(axis=2) >= BLANCO_PURO - 12)
    return m & ~quitar


def color_del_producto(rgb, alfa):
    """En el borde, reemplaza el color mezclado con el fondo por el del producto más cercano."""
    nucleo = ndi.binary_erosion(alfa > 0.98, iterations=2)
    if nucleo.sum() < 50:
        return rgb
    dist, (iy, ix) = ndi.distance_transform_edt(~nucleo, return_indices=True)
    out = rgb.copy()
    cambiar = (~nucleo) & (dist <= BANDA)
    out[cambiar] = rgb[iy, ix][cambiar]
    return out


def forma_del_casco(m):
    """Casco convexo de la máscara (relleno)."""
    ys, xs = np.nonzero(m)
    paso = max(1, len(xs) // 4000)
    pts = np.column_stack([xs[::paso], ys[::paso]])
    try:
        c = ConvexHull(pts)
    except Exception:
        return m
    img = Image.new('L', (m.shape[1], m.shape[0]), 0)
    ImageDraw.Draw(img).polygon([tuple(pts[v]) for v in c.vertices], fill=1)
    return np.asarray(img).astype(bool)


def disco(radio):
    y, x = np.ogrid[-radio:radio + 1, -radio:radio + 1]
    return (x * x + y * y) <= radio * radio


def cerrar_mordidas(m, radio):
    """Cierre morfológico con un disco grande: rellena las mordidas del borde (cajas blancas sobre fondo blanco)
    sin trazar el casco entero, que agregaría cuñas de fondo entre el frasco y la caja."""
    margen = radio + 2
    grande = np.pad(m, margen)
    grande = ndi.binary_closing(grande, structure=disco(radio))
    return ndi.binary_fill_holes(grande)[margen:-margen, margen:-margen]


def recortar(original, modelo, salida, conservar_blanco=False, casco=False, cierre=0):
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
    if not conservar_blanco:
        m = quitar_blanco_de_fondo(m, rgb, alfa)
    if cierre:
        m = cerrar_mordidas(m, cierre)
    if casco:
        m = ndi.binary_dilation(m, iterations=3)
        m = m | forma_del_casco(m)
    m = ndi.binary_erosion(m, iterations=1)
    # Después de quitar el blanco pueden quedar piezas sueltas.
    etiquetas, n = ndi.label(m)
    if n:
        tam = ndi.sum(m, etiquetas, range(1, n + 1))
        m = np.isin(etiquetas, [k + 1 for k, t in enumerate(tam) if t >= 0.03 * tam.max()])

    suave = np.clip((ndi.gaussian_filter(m.astype(np.float32), 1.0) - 0.2) / 0.6, 0, 1)
    rgb2 = color_del_producto(rgb.astype(np.float32), suave)
    img = Image.fromarray(np.dstack([rgb2.clip(0, 255), suave * 255]).astype(np.uint8), 'RGBA')
    caja = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if caja:
        img = img.crop(caja)
    pre = img.convert('RGBa')  # achica con la transparencia premultiplicada: sin halos en el borde
    pre.thumbnail(ALTO_MAX, Image.LANCZOS)
    pre.convert('RGBA').save(salida, 'WEBP', quality=88, method=6)

    # Métrica: qué parte de lo que se aparta del fondo quedó dentro del recorte (solo orientativa).
    dif = ndi.binary_fill_holes(ndi.binary_closing(np.abs(rgb.astype(int) - fondo_estimado(rgb).astype(int)).max(axis=2) > 28, structure=np.ones((5, 5)), iterations=2))
    cobertura = float((m & dif).sum() / max(1, dif.sum()))
    return {'cobertura': round(cobertura, 3), 'ocupacion': round(float(m.sum() / m.size), 3)}


if __name__ == '__main__':
    banderas = sys.argv[4:]
    cierre = next((int(b.split('=')[1]) for b in banderas if b.startswith('--cierre=')), 0)
    print(json.dumps(recortar(sys.argv[1], sys.argv[2], sys.argv[3], '--conservar-blanco' in banderas, '--casco' in banderas, cierre)))
