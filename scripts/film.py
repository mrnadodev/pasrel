"""Fabrique le film « Pasrèl, la traversée » en MP4.

Cinquante secondes sur une seule image — le ravin, les planches, le passage —
sur le vert profond de la campagne. Ce n'est pas le spot produit : le spot
vend, celui-ci raconte. D'où un texte en serif qui prend son temps, peu
d'éléments par écran, et beaucoup de vide.

Le serif n'est pas un ornement : le mot PASRÈL du logo est composé en serif.
Le film emprunte la lettre de la marque, pas celle de l'interface.

    .venv\\Scripts\\python.exe scripts/film.py sortie.mp4 [--langue ht|fr] [--musique x.wav]

Sans `--musique`, le fichier sort muet — une piste image, et rien d'autre.
C'est ce qu'il faut pour monter la voix soi-même.
"""

from __future__ import annotations

import argparse
import sys
from fractions import Fraction
from pathlib import Path

import av
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from police import figtree, newsreader  # noqa: E402
import fond as FOND  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent

L, H = 1080, 1920
IPS = 30
DUREE = 50.0

NWI = (6, 35, 28)          # le vert profond
VET = (37, 211, 102)       # l'accent, une seule fois
PAPYE = (242, 246, 244)    # le texte
PAPYE_DOU = (169, 196, 188)
BWA = (201, 179, 138)      # le bois des planches

# Le ravin vit sous le texte, aux trois quarts de la hauteur : on regarde
# par-dessus, pas au travers.
RAVIN_Y = int(H * 0.73)
RIVE = int(L * 0.26)       # largeur de chaque rive

# Les planches se posent une à une, exactement comme sur la page animée.
PLANCHES = [
    (0.25, 0.11, -2.4), (0.355, 0.10, 1.8), (0.45, 0.11, -1.2),
    (0.555, 0.10, 2.6), (0.65, 0.11, -1.9),
]
POSE = [31.5, 32.12, 32.74, 33.36, 33.98]

PLANS = [
    (0.0, 5.5), (5.5, 11.5), (11.5, 18.5), (18.5, 25.0),
    (25.0, 31.0), (31.0, 38.0), (38.0, 44.5), (44.5, 50.0),
]

# Les trois demandes de clients ne se traduisent dans aucune version : ce sont
# de vraies phrases, telles qu'elles arrivent dans WhatsApp.
DEMANDES = ["« Ou gen li an 40 ? »", "« Konbyen pou sa ? »", "« M ap pase demen. »"]

TEXTES = {
    "ht": {
        "p1": "An Ayiti, yon pasrèl se pa yon moniman.",
        "p2": "Se kèk planch moun ki gen pou travèse a poze yo menm.",
        "e3": "YON BÒ", "p3": "Kliyan yo. Nan WhatsApp.",
        "e4": "LÒT BÒ A",
        "l4": ["kòmand yo pou swiv", "stòk la pou konte",
               "18 000 goud yon kliyan pa janm peye", "chif yo ou ta renmen gade"],
        "p5a": "Nan mitan, anyen.", "p5b": "Konvèsasyon an fèt, epi li disparèt.",
        "p6a": "PASRÈL", "p6b": " se travèse a.",
        "p7": "Nou pa envante komès la. Li te deja la, nan konvèsasyon yo. Nou jis bati pasaj la.",
        "p8": "Kote konvèsasyon tounen kliyan.",
    },
    "fr": {
        "p1": "En Haïti, une passerelle n'est pas un monument.",
        "p2": "C'est quelques planches posées par ceux qui doivent le traverser.",
        "e3": "D'UN CÔTÉ", "p3": "Les clients. Dans WhatsApp.",
        "e4": "DE L'AUTRE",
        "l4": ["les commandes à suivre", "le stock à compter",
               "18 000 gourdes qu'un client n'a jamais payées", "les chiffres qu'il faudrait regarder"],
        "p5a": "Entre les deux, rien.", "p5b": "La conversation a lieu, puis elle s'évapore.",
        "p6a": "PASRÈL", "p6b": " est la traversée.",
        "p7": "On n'a pas inventé le commerce. Il était déjà là, dans les conversations. On a juste construit le passage.",
        "p8": "Là où les conversations deviennent des clients.",
    },
}

_cache: dict = {}


def serif(taille: int, variante: str = "Regular") -> ImageFont.FreeTypeFont:
    cle = ("s", taille, variante)
    if cle not in _cache:
        chemin, vraie = newsreader()
        f = ImageFont.truetype(str(chemin), taille)
        if vraie:
            try:
                f.set_variation_by_name(variante)
            except Exception:
                pass
        _cache[cle] = f
    return _cache[cle]


def sans(taille: int, variante: str = "Bold") -> ImageFont.FreeTypeFont:
    cle = ("n", taille, variante)
    if cle not in _cache:
        chemin, vraie = figtree(800)
        f = ImageFont.truetype(str(chemin), taille)
        if vraie:
            try:
                f.set_variation_by_name(variante)
            except Exception:
                pass
        _cache[cle] = f
    return _cache[cle]


def doux(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - pow(1 - x, 3)


def melange(a, b, t: float):
    t = max(0.0, min(1.0, t))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def lignes(d, texte, f, largeur):
    mots, out, courant = texte.split(), [], ""
    for m in mots:
        essai = f"{courant} {m}".strip()
        if d.textlength(essai, font=f) <= largeur or not courant:
            courant = essai
        else:
            out.append(courant)
            courant = m
    if courant:
        out.append(courant)
    return out


def narration(d, texte, taille, y, couleur=PAPYE, alpha=1.0, accent=None):
    """Le texte du film : centré, serif, posé au-dessus du ravin."""
    f = serif(taille, "Regular")
    ls = lignes(d, texte, f, 880)
    h = round(taille * 1.26)
    y0 = y - (len(ls) * h) / 2
    for i, ligne in enumerate(ls):
        x = (L - d.textlength(ligne, font=f)) / 2
        if accent and accent in ligne:
            # Le mot PASRÈL prend le vert ; le reste de la ligne reste encre.
            avant, _, apres = ligne.partition(accent)
            cx = x
            for bout, c in ((avant, couleur), (accent, VET), (apres, couleur)):
                if bout:
                    d.text((cx, y0 + i * h), bout, font=f, fill=melange(NWI, c, alpha))
                    cx += d.textlength(bout, font=f)
        else:
            d.text((x, y0 + i * h), ligne, font=f, fill=melange(NWI, couleur, alpha))
    return len(ls) * h


def bulle(d, cx: float, cy: float, taille: float, couleur, alpha: float):
    """La bulle de conversation, dans la forme même du motif de fond.

    C'est voulu : ce qui traverse le pont doit être la même chose que ce qui
    flotte derrière, en plein. Une autre forme introduirait un vocabulaire de
    plus au moment où le film n'en a plus besoin.
    """
    c = melange(NWI, couleur, alpha)
    r = taille / 2
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=c)
    # La pointe, en bas à gauche, comme sur le motif.
    p = taille * 0.34
    d.polygon([(cx - r * 0.62, cy + r * 0.52), (cx - r * 0.62, cy + r * 0.52 + p),
               (cx - r * 0.02, cy + r * 0.52)], fill=c)


def message_traverse(d, t: float):
    """Le message qui passe d'une rive à l'autre, une fois le pont posé.

    Il attend que la dernière planche soit en place — traverser un pont qu'on
    est en train de construire ne voudrait rien dire — puis il part, lentement,
    avec le léger balancement de quelqu'un qui marche sur des planches.
    """
    DEPART, ARRIVEE = 35.0, 37.6
    if t < DEPART:
        return
    k = min(1.0, (t - DEPART) / (ARRIVEE - DEPART))

    # Une entrée et une sortie en fondu : il vient de la conversation, il entre
    # dans le commerce, il ne surgit pas et ne s'arrête pas net.
    alpha = min(1.0, k / 0.12) * (1 - max(0.0, (k - 0.86) / 0.14))
    if alpha <= 0:
        return

    # Le trajet, d'une rive à l'autre, avec un très léger arc.
    x0, x1 = RIVE * 0.70, L - RIVE * 0.70
    e = k * k * (3 - 2 * k)                      # départ et arrivée adoucis
    cx = x0 + (x1 - x0) * e
    arc = -abs(np.sin(k * np.pi)) * L * 0.035    # il s'élève un peu au milieu
    pas = np.sin(k * np.pi * 7) * L * 0.004      # le balancement des planches
    cy = RAVIN_Y - L * 0.055 + arc + pas

    bulle(d, cx, cy, L * 0.085, PAPYE, alpha)


def ravin(d, t: float, visible: bool):
    """Les deux rives, le vide entre elles, et les planches quand elles sont posées."""
    if not visible:
        return
    ep = max(2, int(L * 0.012))
    d.rectangle((0, RAVIN_Y - ep // 2, RIVE, RAVIN_Y + ep // 2), fill=PAPYE_DOU)
    d.rectangle((L - RIVE, RAVIN_Y - ep // 2, L, RAVIN_Y + ep // 2), fill=PAPYE_DOU)
    # Les parois descendent dans le noir : un dégradé, pas un trait net.
    hauteur = int(L * 0.15)
    for k in range(hauteur):
        a = 1 - k / hauteur
        c = melange(NWI, PAPYE_DOU, a * 0.5)
        d.rectangle((RIVE - ep, RAVIN_Y + k, RIVE, RAVIN_Y + k + 1), fill=c)
        d.rectangle((L - RIVE, RAVIN_Y + k, L - RIVE + ep, RAVIN_Y + k + 1), fill=c)

    for (gx, gw, angle), quand in zip(PLANCHES, POSE):
        a = doux((t - quand) / 0.5)
        if a <= 0:
            continue
        x, w = gx * L, gw * L
        hp = max(3, int(L * 0.015))
        dy = (1 - a) * L * 0.07
        # L'inclinaison dit la main : ces planches sont posées, pas construites.
        decal = angle / 2.4 * hp
        d.polygon(
            [(x, RAVIN_Y + dy - decal), (x + w, RAVIN_Y + dy + decal),
             (x + w, RAVIN_Y + dy + decal + hp), (x, RAVIN_Y + dy - decal + hp)],
            fill=melange(NWI, BWA, a),
        )


# ──────────────────────────────── les plans ────────────────────────────────

def plan(i: int, d, img, t: float, T, arche):
    a = doux(t / 1.3)                  # l'entrée, lente : on raconte
    ravin(d, t + PLANS[i][0], i >= 1 and i != 7)

    if i == 0:
        narration(d, T["p1"], 72, H * 0.42, alpha=a)
    elif i == 1:
        narration(d, T["p2"], 68, H * 0.40, alpha=a)
    elif i == 2:
        f = sans(30, "Bold")
        d.text(((L - d.textlength(T["e3"], font=f)) / 2, H * 0.20), T["e3"],
               font=f, fill=melange(NWI, PAPYE_DOU, a))
        # Les voix montent, et elles s'en vont.
        for k, mot in enumerate(DEMANDES):
            depart = 0.3 + k * 1.2
            v = t - depart
            if v < 0:
                continue
            op = min(1.0, v / 0.8) * (1 - max(0.0, (v - 3.4) / 1.1))
            if op <= 0:
                continue
            fi = serif(56, "Regular")
            dy = -min(60, max(0, (v - 3.4) * 48))
            d.text(((L - d.textlength(mot, font=fi)) / 2, H * 0.30 + k * 100 + dy),
                   mot, font=fi, fill=melange(NWI, PAPYE, op))
        narration(d, T["p3"], 50, H * 0.58, alpha=doux((t - 3.6) / 1.0))
    elif i == 3:
        f = sans(30, "Bold")
        d.text(((L - d.textlength(T["e4"], font=f)) / 2, H * 0.20), T["e4"],
               font=f, fill=melange(NWI, PAPYE_DOU, a))
        for k, ligne in enumerate(T["l4"]):
            b = doux((t - 0.4 - k * 0.7) / 0.9)
            if b <= 0:
                continue
            fort = k == 2            # la dette : la seule en blanc franc
            fi = serif(48 if not fort else 50, "Regular" if not fort else "SemiBold")
            d.text(((L - d.textlength(ligne, font=fi)) / 2, H * 0.31 + k * 86),
                   ligne, font=fi, fill=melange(NWI, PAPYE if fort else PAPYE_DOU, b))
    elif i == 4:
        narration(d, T["p5a"], 76, H * 0.33, alpha=a)
        narration(d, T["p5b"], 48, H * 0.46, couleur=PAPYE_DOU, alpha=doux((t - 1.4) / 1.2))
    elif i == 5:
        narration(d, T["p6a"] + T["p6b"], 72, H * 0.36, alpha=a, accent=T["p6a"])
    elif i == 6:
        narration(d, T["p7"], 58, H * 0.36, alpha=a)
    else:
        # L'arche seule : elle EST les planches, une fois finies.
        w = int(L * 0.46 * (0.82 + 0.18 * a))
        hh = round(w * arche.height / arche.width)
        vue = arche.resize((w, hh), Image.LANCZOS)
        img.paste(vue, ((L - w) // 2, int(H * 0.33) + int((1 - a) * 40)), vue)
        narration(d, T["p8"], 44, H * 0.55, couleur=PAPYE_DOU, alpha=doux((t - 0.8) / 1.0))
        b = doux((t - 1.3) / 0.9)
        if b > 0:
            f = sans(52, "ExtraBold")
            pw = d.textlength("pasrel.app", font=f) + 110
            px, py = (L - pw) / 2, H * 0.64
            d.rounded_rectangle((px, py, px + pw, py + 112), radius=56,
                                fill=melange(NWI, VET, b))
            d.text((px + 55, py + 28), "pasrel.app", font=f, fill=melange(NWI, NWI, 1))


def rendre(sortie: Path, langue: str, musique: Path | None) -> None:
    T = TEXTES[langue]
    arche = Image.open(RACINE / "public" / "pasrel-white-cadree.png").convert("RGBA")

    conteneur = av.open(str(sortie), mode="w")
    flux = conteneur.add_stream("libx264", rate=IPS)
    flux.width, flux.height = L, H
    flux.pix_fmt = "yuv420p"
    flux.options = {"crf": "19", "preset": "medium", "profile": "high"}
    flux.time_base = Fraction(1, IPS)

    # Les deux flux doivent exister avant le premier paquet, sinon le flux
    # ajouté après n'a plus de base de temps.
    son = None
    if musique and musique.exists():
        son = conteneur.add_stream("aac", rate=44100)
        son.layout = "stereo"

    total = int(DUREE * IPS)
    for n in range(total):
        t = n / IPS
        i = next((k for k, (x, y) in enumerate(PLANS) if x <= t < y), len(PLANS) - 1)
        img = Image.new("RGB", (L, H), NWI)
        FOND.aplat(img, t, NWI)
        d = ImageDraw.Draw(img, "RGBA")
        plan(i, d, img, t - PLANS[i][0], T, arche)
        message_traverse(d, t)

        for paquet in flux.encode(av.VideoFrame.from_ndarray(np.asarray(img), format="rgb24")):
            conteneur.mux(paquet)
        if n % (IPS * 5) == 0:
            print(f"  {t:4.1f} s / {DUREE} s")

    for paquet in flux.encode():
        conteneur.mux(paquet)

    if son is not None:
        with av.open(str(musique)) as src:
            piste = next(s for s in src.streams if s.type == "audio")
            reech = av.audio.resampler.AudioResampler(format="fltp", layout="stereo", rate=44100)
            for trame in src.decode(piste):
                for sortie_trame in reech.resample(trame):
                    sortie_trame.pts = None
                    for paquet in son.encode(sortie_trame):
                        conteneur.mux(paquet)
            for sortie_trame in reech.resample(None):
                sortie_trame.pts = None
                for paquet in son.encode(sortie_trame):
                    conteneur.mux(paquet)
        for paquet in son.encode():
            conteneur.mux(paquet)

    conteneur.close()


def main() -> int:
    for flux in (sys.stdout, sys.stderr):
        try:
            flux.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    a = argparse.ArgumentParser(description="Rend le film « Pasrèl, la traversée » en MP4.")
    a.add_argument("sortie", type=Path)
    a.add_argument("--langue", choices=("ht", "fr"), default="ht")
    a.add_argument("--musique", type=Path, default=None)
    o = a.parse_args()

    print(f"rendu {L}×{H}, {IPS} i/s, {DUREE} s — langue « {o.langue} »"
          + ("" if o.musique else ", sans musique"))
    rendre(o.sortie, o.langue, o.musique)
    print(f"\n{o.sortie}  {o.sortie.stat().st_size / 1048576:.1f} Mo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
