from pathlib import Path
import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "icon.svg"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
png = cairosvg.svg2png(url=str(SOURCE), output_width=512, output_height=512)
import io
image = Image.open(io.BytesIO(png)).convert("RGBA")

for density, size in {"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}.items():
    folder = RES / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    image.resize((size,size), Image.Resampling.LANCZOS).save(folder / "ic_launcher.png")
    image.resize((size,size), Image.Resampling.LANCZOS).save(folder / "ic_launcher_round.png")

drawable = RES / "drawable"
drawable.mkdir(parents=True, exist_ok=True)
image.resize((432,432), Image.Resampling.LANCZOS).save(drawable / "ic_launcher_foreground.png")
adaptive = RES / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
for name in ("ic_launcher", "ic_launcher_round"):
    (adaptive / f"{name}.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '  <background android:drawable="@color/ic_launcher_background"/>\n'
        '  <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n', encoding="utf-8")
values = RES / "values"
values.mkdir(parents=True, exist_ok=True)
(values / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources><color name="ic_launcher_background">#07132F</color></resources>\n',
    encoding="utf-8")
print("Generated launcher icons for mdpi through xxxhdpi and Android adaptive icons.")
