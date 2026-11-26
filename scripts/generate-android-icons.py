from pathlib import Path
import io
import re

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "icon.svg"
ANDROID = ROOT / "android" / "app" / "src" / "main"
RES = ANDROID / "res"
MANIFEST = ANDROID / "AndroidManifest.xml"

if not SOURCE.is_file():
    raise SystemExit(f"Launcher icon source is missing: {SOURCE}")
if not MANIFEST.is_file():
    raise SystemExit(f"Android manifest is missing: {MANIFEST}")

png = cairosvg.svg2png(url=str(SOURCE), output_width=512, output_height=512)
image = Image.open(io.BytesIO(png)).convert("RGBA")

# Legacy launcher resources for older Android versions and launchers.
for density, size in {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}.items():
    folder = RES / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    for name in ("ic_launcher.png", "ic_launcher_round.png"):
        image.resize((size, size), Image.Resampling.LANCZOS).save(folder / name)

# Adaptive launcher icon resources for Android 8.0+.
drawable = RES / "drawable"
drawable.mkdir(parents=True, exist_ok=True)
image.resize((432, 432), Image.Resampling.LANCZOS).save(
    drawable / "ic_launcher_foreground.png"
)

adaptive = RES / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
for name in ("ic_launcher", "ic_launcher_round"):
    (adaptive / f"{name}.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '  <background android:drawable="@color/ic_launcher_background"/>\n'
        '  <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n',
        encoding="utf-8",
    )

values = RES / "values"
values.mkdir(parents=True, exist_ok=True)
(values / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources><color name="ic_launcher_background">#07132F</color></resources>\n',
    encoding="utf-8",
)

# Explicitly point the installed Android application at the generated resources.
manifest = MANIFEST.read_text(encoding="utf-8")
match = re.search(r"<application\b[^>]*>", manifest, flags=re.DOTALL)
if not match:
    raise SystemExit("Could not find the <application> element in AndroidManifest.xml")

application_tag = match.group(0)
for attribute, value in (
    ("icon", "@mipmap/ic_launcher"),
    ("roundIcon", "@mipmap/ic_launcher_round"),
):
    pattern = rf'android:{attribute}\s*=\s*"[^"]*"'
    replacement = f'android:{attribute}="{value}"'
    if re.search(pattern, application_tag):
        application_tag = re.sub(pattern, replacement, application_tag)
    else:
        application_tag = application_tag[:-1] + f' {replacement}>'

manifest = manifest[:match.start()] + application_tag + manifest[match.end():]
MANIFEST.write_text(manifest, encoding="utf-8")

# Fail the build if any launcher resource or manifest reference is missing.
required = [
    RES / f"mipmap-{density}" / filename
    for density in ("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")
    for filename in ("ic_launcher.png", "ic_launcher_round.png")
]
required += [
    adaptive / "ic_launcher.xml",
    adaptive / "ic_launcher_round.xml",
    drawable / "ic_launcher_foreground.png",
    values / "ic_launcher_background.xml",
]
missing = [str(path) for path in required if not path.is_file()]
if missing:
    raise SystemExit("Missing generated launcher resources: " + ", ".join(missing))
if 'android:icon="@mipmap/ic_launcher"' not in application_tag:
    raise SystemExit("Android manifest does not reference the generated launcher icon")
if 'android:roundIcon="@mipmap/ic_launcher_round"' not in application_tag:
    raise SystemExit("Android manifest does not reference the generated round launcher icon")

print(
    "Verified custom Android launcher icon: legacy densities, adaptive icons, "
    "and AndroidManifest.xml icon/roundIcon references."
)
