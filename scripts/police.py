"""Récupère Figtree, la police de la campagne, en TrueType.

Le site la charge depuis Google Fonts en woff2, que Pillow ne sait pas lire.
Google sert en revanche du TrueType à un navigateur assez ancien pour ne pas
connaître le woff2 : c'est ce qu'on demande ici, par l'`User-Agent`.

Si le réseau refuse, on retombe sur une police du système. Le rendu change
alors légèrement — c'est dit à l'écran plutôt que caché, parce qu'un spot
composé dans la mauvaise police ne ressemble plus aux affiches.
"""

from __future__ import annotations

import re
import urllib.request
from pathlib import Path

CACHE = Path(__file__).resolve().parent.parent / ".venv" / "polices"

# Un navigateur d'avant le woff2 : Google lui sert du TrueType.
VIEUX = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)"

REPLIS = [
    Path("C:/Windows/Fonts/segoeuib.ttf"),
    Path("C:/Windows/Fonts/arialbd.ttf"),
    Path("C:/Windows/Fonts/seguisb.ttf"),
]


def newsreader() -> tuple[Path, bool]:
    """Le serif du film. Même logique que Figtree, autre dépôt.

    Le serif n'est pas un ornement : le mot PASRÈL du logo est composé en
    serif. Le film emprunte la lettre de la marque, pas celle de l'interface.
    """
    CACHE.mkdir(parents=True, exist_ok=True)
    cible = CACHE / "newsreader.ttf"
    if cible.exists() and cible.stat().st_size > 20_000:
        return cible, True

    sources = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/eczar/Eczar%5Bwght%5D.ttf",
    ]
    dernier = "aucune source essayée"
    for url in sources:
        try:
            requete = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(requete, timeout=25) as r:
                brut = r.read()
            if len(brut) < 20_000 or brut[:4] not in (b"\x00\x01\x00\x00", b"true", b"OTTO"):
                raise RuntimeError("ce n'est pas un TrueType")
            cible.write_bytes(brut)
            return cible, True
        except Exception as e:
            dernier = f"{type(e).__name__}: {e}"

    print(f"Newsreader indisponible ({dernier}) — on reprend un serif du systeme.")
    for p in (Path("C:/Windows/Fonts/georgia.ttf"), Path("C:/Windows/Fonts/times.ttf")):
        if p.exists():
            return p, False
    raise SystemExit("aucun serif utilisable sur cette machine")


def figtree(graisse: int = 800) -> tuple[Path, bool]:
    """Rend le chemin d'un TTF et si c'est bien Figtree."""
    CACHE.mkdir(parents=True, exist_ok=True)
    cible = CACHE / f"figtree-{graisse}.ttf"
    if cible.exists() and cible.stat().st_size > 20_000:
        return cible, True

    # Trois voies, de la plus propre à la plus directe. Google Fonts ne sert
    # plus de TrueType, même à un vieux navigateur — mesuré, pas supposé — donc
    # la seconde est celle qui aboutit en pratique : le dépôt officiel des
    # polices Google, qui publie la version variable en TTF.
    sources = [
        ("css", f"https://fonts.googleapis.com/css?family=Figtree:{graisse}"),
        ("ttf", "https://raw.githubusercontent.com/google/fonts/main/ofl/figtree/Figtree%5Bwght%5D.ttf"),
        ("ttf", "https://raw.githubusercontent.com/erikdkennedy/figtree/master/fonts/ttf/Figtree-ExtraBold.ttf"),
    ]
    dernier = "aucune source essayée"
    for genre, url in sources:
        try:
            entete = {"User-Agent": VIEUX if genre == "css" else "Mozilla/5.0"}
            with urllib.request.urlopen(urllib.request.Request(url, headers=entete), timeout=25) as r:
                brut = r.read()
            if genre == "css":
                lien = re.search(r"url\((https://[^)]+\.ttf)\)", brut.decode("utf-8", "replace"))
                if not lien:
                    raise RuntimeError("pas de TrueType dans la feuille de style")
                with urllib.request.urlopen(lien.group(1), timeout=30) as r:
                    brut = r.read()
            if len(brut) < 20_000 or brut[:4] not in (b"\x00\x01\x00\x00", b"true", b"OTTO"):
                raise RuntimeError("ce n'est pas un TrueType")
            cible.write_bytes(brut)
            return cible, True
        except Exception as e:
            dernier = f"{type(e).__name__}: {e}"

    print(f"Figtree indisponible ({dernier}) — on reprend une police du systeme.")
    for p in REPLIS:
        if p.exists():
            return p, False
    raise SystemExit("aucune police utilisable sur cette machine")


if __name__ == "__main__":
    for g in (700, 800, 900):
        chemin, vraie = figtree(g)
        print(f"{g} : {chemin.name}  {'Figtree' if vraie else 'REPLI'}  {chemin.stat().st_size // 1024} Ko")
