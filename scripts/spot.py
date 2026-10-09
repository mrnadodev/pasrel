"""Fabrique le spot PASRÈL 9:16 en MP4 — image, musique, et rien d'autre.

Ce script redessine le spot image par image, en 1080 × 1920, puis l'encode
en H.264 avec son instrumental en AAC. Il ne remplace pas la page animée : il
en rend un fichier, qu'on dépose dans TikTok, dans un statut WhatsApp, ou
dans un montage pour y poser la voix.

La voix n'y est pas, et ce n'est pas un oubli. Aucun moteur de synthèse ne
parle créole ; elle se pose au montage, sur une piste à part. Les minutages
ci-dessous sont ceux du script de voix, à la seconde.

    .venv\\Scripts\\python.exe scripts/spot.py sortie.mp4 [--langue ht|fr]

Tout vient des affiches de la campagne : le vert profond #06231C, le motif de
bulles, Figtree, les bulles de conversation, l'arche. Un spot composé dans
d'autres couleurs ne serait pas de la même marque.
"""

from __future__ import annotations

import argparse
import math
import sys
from fractions import Fraction
from pathlib import Path

import av
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from police import figtree  # noqa: E402
import fond as FOND  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent

L, H = 1080, 1920
IPS = 30
DUREE = 38.5

# La palette, reprise des artboards.
NWI = (6, 35, 28)          # le vert profond du fond
VET = (37, 211, 102)       # l'accent
MAK = (0, 128, 105)        # le vert des en-têtes
BIL_ANTRE = (19, 52, 44)   # la bulle reçue
BIL_SOTI = (28, 78, 63)    # la bulle envoyée
TEX = (233, 241, 237)
TEX_PAL = (207, 245, 231)
AVTI = (178, 94, 9)        # l'avertissement
AVTI_KLE = (240, 168, 96)
KLE = (242, 246, 244)      # le panneau clair de la chute
BLAN = (255, 255, 255)

# Les plans, avec leur entrée et leur sortie. Même découpe que la page animée
# et que la feuille de voix : si l'une bouge, les trois bougent.
PLANS = [
    (0.0, 4.2), (4.2, 9.0), (9.0, 14.0), (14.0, 17.2),
    (17.2, 23.0), (23.0, 28.5), (28.5, 32.8), (32.8, 38.5),
]

TEXTES = {
    "ht": {
        "sur1": "VANN SOU WHATSAPP",
        "tit1": "Konbyen kòmand ou pèdi nan konvèsasyon an?",
        "sur2": "KATALÒG OU",
        "di2": "Twa gwoup backup, paske ou pè pèdi l.",
        "chips": ["Katalòg", "Chanèl", "BACKUP", "Katalòg 2", "BACKUP 2", "BACKUP 3"],
        "fil": ["Bonjou, ou gen pen konplè?", "Wi — 155 HTG inite a",
                "Voye 2, ak 1 douzèn ze. Delmas 31.", "Alo? Ou la?"],
        "pedi": "PÈDI NAN FIL LA",
        "di4": "Pon ki mennen biznis ou pi lwen.",
        "tit5a": "Yon sèl lyen.", "tit5b": "Tout boutik ou.",
        "boutik": "Ti Kòk Boutik", "ouvri": "Louvri · 7am–7pm · Delmas 31",
        "pwo1": "Pen konplè", "pwo2": "Ze fre", "wa": "Kòmande sou WhatsApp",
        "di6": "Chak kòmand swiv, jiskaske lajan an antre.",
        "di7a": "Sou Marketplace la, kliyan jwenn ou.", "di7b": "Ou pa rate anyen.",
        "sur8": "GRATIS POU KÒMANSE",
        "chit": "Ak PASRÈL, chak kòmand gen plas pa li.",
        "kf": ["Pa gen kat kredi", "An liy nan 5 minit", "Pa gen API WhatsApp peye"],
    },
    "fr": {
        "sur1": "VENDEZ SUR WHATSAPP",
        "tit1": "Combien de commandes perdez-vous dans la conversation ?",
        "sur2": "VOTRE CATALOGUE",
        "di2": "Trois groupes de secours, parce que vous avez peur de le perdre.",
        "chips": ["Catalogue", "Chaîne", "BACKUP", "Catalogue 2", "BACKUP 2", "BACKUP 3"],
        "fil": ["Bonjour, vous avez du pain complet ?", "Oui — 155 HTG l'unité",
                "Envoyez-en 2, et une douzaine d'œufs. Delmas 31.", "Allô ? Vous êtes là ?"],
        "pedi": "PERDUE DANS LE FIL",
        "di4": "Le pont entre les conversations et la croissance.",
        "tit5a": "Un seul lien.", "tit5b": "Toute votre vitrine.",
        "boutik": "Ti Kòk Boutik", "ouvri": "Ouvert · 7h–19h · Delmas 31",
        "pwo1": "Pain complet", "pwo2": "Œufs frais", "wa": "Commander sur WhatsApp",
        "di6": "Chaque commande suivie, jusqu'à l'argent encaissé.",
        "di7a": "Sur le Marketplace, les clients vous trouvent.", "di7b": "Vous ne ratez rien.",
        "sur8": "GRATUIT POUR COMMENCER",
        "chit": "Avec PASRÈL, chaque commande a sa place.",
        "kf": ["Aucune carte bancaire", "En ligne en 5 minutes", "Sans API WhatsApp payante"],
    },
}


# ───────────────────────────── petits outils ─────────────────────────────

_cache: dict[tuple[int, str], ImageFont.FreeTypeFont] = {}


def pol(taille: int, graisse: str = "ExtraBold") -> ImageFont.FreeTypeFont:
    cle = (taille, graisse)
    if cle not in _cache:
        chemin, vraie = figtree(800)
        f = ImageFont.truetype(str(chemin), taille)
        if vraie:
            try:
                f.set_variation_by_name(graisse)
            except Exception:
                pass
        _cache[cle] = f
    return _cache[cle]


def doux(x: float) -> float:
    """Une entrée qui décélère — jamais linéaire, l'œil le voit."""
    x = max(0.0, min(1.0, x))
    return 1 - pow(1 - x, 3)


def melange(a, b, t: float):
    t = max(0.0, min(1.0, t))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def lignes(d: ImageDraw.ImageDraw, texte: str, f, largeur: int) -> list[str]:
    """Coupe un texte pour qu'il tienne dans la largeur donnée."""
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


def bloc(d, texte, f, largeur, x, y, couleur, interligne=1.12, centre=False, accents=None):
    """Pose un paragraphe et rend la hauteur occupée."""
    ls = lignes(d, texte, f, largeur)
    h = round(f.size * interligne)
    for i, ligne in enumerate(ls):
        px = x + (largeur - d.textlength(ligne, font=f)) / 2 if centre else x
        c = couleur
        if accents:
            for mot, teinte in accents.items():
                if mot in ligne:
                    c = teinte
        d.text((px, y + i * h), ligne, font=f, fill=c)
    return len(ls) * h


def rrect(d, boite, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(boite, radius=r, fill=fill, outline=outline, width=width)


def fond(img, t, couleur, avec_motif=True):
    """Le fond des artboards — extrait dans scripts/fond.py pour que le spot
    et le film partagent exactement le meme, motif de bulles compris."""
    FOND.aplat(img, t, couleur, avec_motif)


def degrade(img, haut, bas):
    FOND.degrade(img, 0.0, haut, bas)


# ──────────────────────────────── les plans ────────────────────────────────

def plan1(img, d, t, T):
    fond(img, t, NWI)
    a = doux(t / 0.6)
    d.text((80, 200 + (1 - a) * 40), T["sur1"], font=pol(32, "ExtraBold"), fill=VET)
    b = doux((t - 0.15) / 0.7)
    bloc(d, T["tit1"], pol(92, "Black"), 920, 80, 290 + (1 - b) * 46, BLAN, 1.06)


def plan2(img, d, t, T):
    fond(img, t, NWI)
    d.text((80, 200), T["sur2"], font=pol(32, "ExtraBold"), fill=VET)
    f = pol(38, "Bold")
    places = [(-170, -300), (140, -150), (-130, 0), (160, 110), (-150, 250), (110, 380)]
    for i, (nom, (dx, dy)) in enumerate(zip(T["chips"], places)):
        a = doux((t - 0.05 - i * 0.45) / 0.5)
        if a <= 0:
            continue
        alerte = nom.startswith("BACKUP")
        w = d.textlength(nom, font=f) + 72
        x = L / 2 + dx - w / 2
        y = H / 2 - 40 + dy - (1 - a) * 50
        rrect(d, (x, y, x + w, y + 84), 26, fill=BIL_ANTRE,
              outline=AVTI if alerte else (255, 255, 255), width=3 if alerte else 1)
        d.text((x + 36, y + 22), nom, font=f, fill=AVTI_KLE if alerte else TEX)
    bloc(d, T["di2"], pol(58, "Black"), 900, 90, H - 460, BLAN, 1.12, centre=True)


def plan3(img, d, t, T):
    fond(img, t, NWI)
    f = pol(38, "SemiBold")
    y = 430
    for i, texte in enumerate(T["fil"]):
        perdue = i == 2
        a = doux((t - 0.1 - i * 0.4) / 0.55)
        if a <= 0:
            continue
        ls = lignes(d, texte, f, 640)
        hh = len(ls) * 52 + 58 + (46 if perdue else 0)
        w = max(d.textlength(l, font=f) for l in ls) + 76
        sortant = i == 1
        x = L - 80 - w if sortant else 80
        dy = 0
        alpha = 1.0
        if perdue:
            # La commande glisse hors du fil et s'éteint : c'est tout le propos.
            g = max(0.0, min(1.0, (t - 2.4) / 1.6))
            x -= g * 150
            dy = g * 30
            alpha = 1 - g * 0.72
        yy = y + dy - (1 - a) * 40
        couleur = BIL_SOTI if sortant else BIL_ANTRE
        couleur = melange(NWI, couleur, alpha)
        rrect(d, (x, yy, x + w, yy + hh), 34, fill=couleur,
              outline=melange(NWI, AVTI, alpha) if perdue else None, width=4 if perdue else 1)
        for k, ligne in enumerate(ls):
            d.text((x + 38, yy + 26 + k * 52), ligne, font=f,
                   fill=melange(NWI, BLAN if sortant else TEX, alpha))
        if perdue:
            d.text((x + 38, yy + 26 + len(ls) * 52 + 10), T["pedi"], font=pol(28, "ExtraBold"),
                   fill=melange(NWI, AVTI_KLE, alpha))
        y += hh + 30


def plan4(img, d, t, T, arche):
    degrade(img, (4, 57, 47), (8, 102, 71))
    a = doux(t / 1.2)
    w = int(620 * (0.55 + 0.45 * a))
    h = round(w * arche.height / arche.width)
    vue = arche.resize((w, h), Image.LANCZOS)
    img.paste(vue, ((L - w) // 2, 700 + int((1 - a) * 60)), vue)
    if t > 1.25:
        bloc(d, T["di4"], pol(56, "Black"), 880, 100, 1000, BLAN, 1.12, centre=True)


def plan5(img, d, t, T):
    degrade(img, (4, 57, 47), (8, 102, 71))
    a = doux(t / 0.7)
    y = 190 + (1 - a) * 40
    f = pol(86, "Black")
    for i, (ligne, couleur) in enumerate(((T["tit5a"], BLAN), (T["tit5b"], VET))):
        d.text(((L - d.textlength(ligne, font=f)) / 2, y + i * 96), ligne, font=f, fill=couleur)

    # Le lien qui s'écrit, au curseur.
    fl = pol(38, "ExtraBold")
    plein = "pasrel.app/b/boutik-ou"
    n = max(0, min(len(plein), int((t - 0.5) / 2.2 * len(plein))))
    vu = plein[:n]
    lw = d.textlength(plein, font=fl) + 90
    lx, ly = (L - lw) / 2, 430
    rrect(d, (lx, ly, lx + lw, ly + 78), 39, fill=(255, 255, 255, 0), outline=(120, 190, 165), width=3)
    d.text((lx + 45, ly + 19), vu, font=fl, fill=BLAN)
    if n < len(plein) and int(t * 2) % 2 == 0:
        d.rectangle((lx + 45 + d.textlength(vu, font=fl) + 6, ly + 16,
                     lx + 45 + d.textlength(vu, font=fl) + 11, ly + 62), fill=VET)

    # La vitrine, telle qu'elle est dans le produit.
    b = doux((t - 0.3) / 0.7)
    tw, th = 660, 720
    tx, ty = (L - tw) / 2, 580 + (1 - b) * 50 - math.sin(t * 1.1) * 12
    rrect(d, (tx, ty, tx + tw, ty + th), 56, fill=BLAN)
    rrect(d, (tx + 22, ty + 22, tx + tw - 22, ty + th - 22), 40, fill=KLE)
    d.rounded_rectangle((tx + 22, ty + 22, tx + tw - 22, ty + 190), radius=40, fill=(6, 70, 58))
    d.rectangle((tx + 22, ty + 150, tx + tw - 22, ty + 190), fill=(6, 70, 58))
    rrect(d, (tx + 58, ty + 56, tx + 144, ty + 142), 26, fill=VET)
    d.text((tx + 80, ty + 78), "TK", font=pol(36, "Black"), fill=NWI)
    d.text((tx + 168, ty + 62), T["boutik"], font=pol(34, "Black"), fill=BLAN)
    d.text((tx + 168, ty + 110), T["ouvri"], font=pol(23, "SemiBold"), fill=TEX_PAL)
    for i, (nom, prix, teinte) in enumerate(((T["pwo1"], "155 HTG", (243, 226, 190)),
                                            (T["pwo2"], "180 HTG", (217, 239, 228)))):
        c = doux((t - 0.6 - i * 0.12) / 0.4)
        if c <= 0:
            continue
        px = tx + 50 + i * 300
        py = ty + 230
        rrect(d, (px, py, px + 270, py + 290), 26, fill=BLAN)
        rrect(d, (px, py, px + 270, py + 150), 26, fill=teinte)
        d.rectangle((px, py + 120, px + 270, py + 150), fill=teinte)
        d.text((px + 22, py + 178), nom, font=pol(26, "Bold"), fill=NWI)
        d.text((px + 22, py + 220), prix, font=pol(28, "Black"), fill=MAK)
    rrect(d, (tx + 50, ty + 560, tx + tw - 50, ty + 654), 26, fill=VET)
    d.text((tx + tw / 2 - d.textlength(T["wa"], font=pol(30, "Black")) / 2, ty + 588),
           T["wa"], font=pol(30, "Black"), fill=NWI)


def plan6(img, d, t, T):
    degrade(img, (4, 57, 47), (8, 102, 71))
    for i in range(4):
        a = doux((t - 0.2 - i * 0.7) / 0.4)
        x = L / 2 - 230 + i * 120
        rrect(d, (x, 760, x + 96, 774), 7, fill=melange((40, 90, 78), VET, a))
    b = doux((t - 2.7) / 0.5)
    if b > 0:
        f = pol(96, "Black")
        s = "2 500 HTG"
        ech = 1.25 - 0.25 * b
        d.text(((L - d.textlength(s, font=f) * ech) / 2, 860), s, font=f,
               fill=melange((8, 102, 71), VET, b))
    bloc(d, T["di6"], pol(58, "Black"), 880, 100, 1120, BLAN, 1.12, centre=True)


def plan7(img, d, t, T):
    fond(img, t, NWI)
    taille, ecart = 162, 24
    total = taille * 3 + ecart * 2
    x0, y0 = (L - total) / 2, 560
    for i in range(9):
        a = doux((t - 0.1 - i * 0.07) / 0.3)
        if a <= 0:
            continue
        cx, cy = i % 3, i // 3
        x, y = x0 + cx * (taille + ecart), y0 + cy * (taille + ecart)
        m = (taille * (1 - a)) / 2
        centre = i == 4
        rrect(d, (x + m, y + m, x + taille - m, y + taille - m), 30,
              fill=VET if centre else BIL_ANTRE, outline=VET if centre else (40, 80, 68), width=2)
    bloc(d, T["di7a"], pol(56, "Black"), 880, 100, 1180, BLAN, 1.12, centre=True)
    bloc(d, T["di7b"], pol(56, "Black"), 880, 100, 1320, VET, 1.12, centre=True)


def plan8(img, d, t, T, arche_sombre):
    degrade(img, (4, 57, 47), (8, 102, 71))
    d.text((80, 200), T["sur8"], font=pol(32, "ExtraBold"), fill=VET)

    a = doux(t / 0.7)
    pw, ph = 920, 560
    px, py = (L - pw) / 2, (H - ph) / 2 + (1 - a) * 40
    rrect(d, (px, py, px + pw, py + ph), 48, fill=KLE)

    w = 230
    h = round(w * arche_sombre.height / arche_sombre.width)
    img.paste(arche_sombre.resize((w, h), Image.LANCZOS), (int(px + 56), int(py + 70)),
              arche_sombre.resize((w, h), Image.LANCZOS))
    bloc(d, T["chit"], pol(50, "Black"), 560, px + 320, py + 56, NWI, 1.14)

    b = doux((t - 0.4) / 0.6)
    if b > 0:
        bx, by = px + 56, py + 300
        rrect(d, (bx, by, px + pw - 56, by + 132), 34, fill=VET)
        f = pol(56, "Black")
        d.text((px + pw / 2 - d.textlength("pasrel.app", font=f) / 2, by + 36),
               "pasrel.app", font=f, fill=NWI)

    c = doux((t - 0.7) / 0.6)
    if c > 0:
        f = pol(26, "Bold")
        y = py + ph - 86
        largeurs = [d.textlength(k, font=f) + 44 for k in T["kf"]]
        x = px + (pw - sum(largeurs) - 24 * 2) / 2
        for k, lw in zip(T["kf"], largeurs):
            rrect(d, (x, y, x + lw, y + 56), 28, outline=(120, 150, 140), width=2)
            d.text((x + 22, y + 14), k, font=f, fill=(78, 106, 98))
            x += lw + 24


# ──────────────────────────────── le rendu ────────────────────────────────

def rendre(sortie: Path, langue: str, musique: Path | None) -> None:
    T = TEXTES[langue]
    arche = Image.open(RACINE / "public" / "pasrel-white-cadree.png").convert("RGBA")
    sombre = Image.open(RACINE / "public" / "pasrel-arche-cadree.png").convert("RGBA")

    conteneur = av.open(str(sortie), mode="w")
    flux = conteneur.add_stream("libx264", rate=IPS)
    flux.width, flux.height = L, H
    flux.pix_fmt = "yuv420p"
    flux.options = {"crf": "19", "preset": "medium", "profile": "high"}
    flux.time_base = Fraction(1, IPS)

    # Les deux flux doivent exister AVANT le premier paquet : l'en-tête du
    # conteneur s'écrit au premier `mux`, et un flux déclaré après n'a plus de
    # base de temps — « Cannot rebase to zero time ». Mesuré, pas supposé.
    son = None
    if musique and musique.exists():
        son = conteneur.add_stream("aac", rate=44100)
        son.layout = "stereo"

    total = int(DUREE * IPS)
    img = Image.new("RGB", (L, H), NWI)

    for n in range(total):
        t = n / IPS
        i = next((k for k, (a, b) in enumerate(PLANS) if a <= t < b), len(PLANS) - 1)
        local = t - PLANS[i][0]
        d = ImageDraw.Draw(img, "RGBA")

        if i == 0: plan1(img, d, local, T)
        elif i == 1: plan2(img, d, local, T)
        elif i == 2: plan3(img, d, local, T)
        elif i == 3: plan4(img, d, local, T, arche)
        elif i == 4: plan5(img, d, local, T)
        elif i == 5: plan6(img, d, local, T)
        elif i == 6: plan7(img, d, local, T)
        else: plan8(img, d, local, T, sombre)

        trame = av.VideoFrame.from_ndarray(np.asarray(img), format="rgb24")
        for paquet in flux.encode(trame):
            conteneur.mux(paquet)

        if n % (IPS * 5) == 0:
            print(f"  {t:4.1f} s / {DUREE} s")

    for paquet in flux.encode():
        conteneur.mux(paquet)

    # La musique, telle quelle, recodée en AAC.
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

    a = argparse.ArgumentParser(description="Rend le spot PASRÈL 9:16 en MP4.")
    a.add_argument("sortie", type=Path)
    a.add_argument("--langue", choices=("ht", "fr"), default="ht")
    a.add_argument("--musique", type=Path, default=None)
    o = a.parse_args()

    print(f"rendu {L}×{H}, {IPS} i/s, {DUREE} s — langue « {o.langue} »")
    rendre(o.sortie, o.langue, o.musique)
    taille = o.sortie.stat().st_size / 1048576
    print(f"\n{o.sortie}  {taille:.1f} Mo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
