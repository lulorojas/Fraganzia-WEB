"""
Genera las fuentes recortadas de src/assets/fonts/ a partir de los paquetes
@fontsource (devDependencies). Solo hace falta correrlo si se cambia de fuente
o se necesitan caracteres nuevos.

    pip install fonttools brotli
    python tools/subset-fonts.py

Por qué: las fuentes completas pesan mucho y el navegador las baja antes de
pintar el texto principal. Recortadas al español quedan en una fracción.

Los paquetes @fontsource no están en package.json: se bajan aparte
(`npm pack @fontsource-variable/outfit @fontsource-variable/manrope`) y se
indica la carpeta donde quedaron con la variable FUENTES_DIR (cada paquete
extraído en <FUENTES_DIR>/<nombre>/package). Sin la variable, usa node_modules.
"""
import os
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = Path(__file__).resolve().parent.parent
NM = Path(os.environ["FUENTES_DIR"]) if os.environ.get("FUENTES_DIR") else RAIZ / "node_modules"
SALIDA = RAIZ / "src" / "assets" / "fonts"

# Latín básico + Latin-1 (tildes, ñ, ü, ¡, ¿, º) + tipografía común en español
# (comillas, rayas, puntos suspensivos, viñeta) + las flechas y ✦ ◆ de la UI.
ESPANOL = (
    "U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20AC,"
    "U+2190-2193,U+2197,U+25C6,U+2726"
)

# (origen, destino, caracteres, rango de pesos a conservar en fuentes variables)
FUENTES = [
    # Outfit llega hasta el peso 300: los títulos grandes van livianos y con aire (look de lujo).
    ("@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2", "outfit.woff2", ESPANOL, (300, 700)),
    ("@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", "manrope.woff2", ESPANOL, (400, 700)),
]

SALIDA.mkdir(parents=True, exist_ok=True)
TEMP = SALIDA / "_temp.ttf"
for origen, destino, caracteres, pesos in FUENTES:
    fuente = TTFont(NM / origen)
    if pesos:
        # Recorta el eje de peso de la fuente variable a lo que usa la web.
        fuente = instancer.instantiateVariableFont(fuente, {"wght": pesos})
    fuente.flavor = None
    fuente.save(TEMP)
    args = [
        str(TEMP),
        f"--output-file={SALIDA / destino}",
        "--flavor=woff2",
        "--layout-features=kern,liga,calt",
        "--no-hinting",
        "--desubroutinize",
    ]
    args.append(f"--text={caracteres[5:]}" if caracteres.startswith("text:") else f"--unicodes={caracteres}")
    subset.main(args)
    antes = (NM / origen).stat().st_size
    despues = (SALIDA / destino).stat().st_size
    print(f"{destino}: {antes // 1024} KB -> {despues // 1024} KB")

TEMP.unlink(missing_ok=True)
