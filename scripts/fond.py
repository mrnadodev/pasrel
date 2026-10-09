"""Le fond de la campagne : le vert profond et son motif de bulles.

Les artboards ne sont pas sur un aplat. Chacun porte le même motif de bulles
de conversation, incliné de huit degrés, à six ou sept pour cent d'opacité, et
qui dérive lentement. C'est ce qui fait qu'on reconnaît la marque avant
d'avoir lu un mot.

Ce fichier existe pour que le spot et le film partagent exactement le même
fond. Deux implémentations finiraient par diverger, et deux verts qui se
ressemblent sans être identiques sont pires qu'un seul mal choisi.

Les valeurs viennent des artboards, relevées dans leur source :
`background: #06231C` et le dégradé `170deg, #04392F → #086647`.
"""

from __future__ import annotations

from PIL import Image, ImageDraw

NWI = (6, 35, 28)            # le vert profond des stories
DEG_HAUT = (4, 57, 47)       # le dégradé de « un seul lien »
DEG_BAS = (8, 102, 71)
BLAN = (255, 255, 255)

_motif: Image.Image | None = None


def motif(largeur: int, hauteur: int, opacite: float = 0.065) -> Image.Image:
    """La nappe de bulles, dessinée une fois puis réutilisée."""
    global _motif
    if _motif is not None and _motif.size == (largeur + 240, hauteur + 240):
        return _motif

    tuile = 120
    m = Image.new("L", (tuile, tuile), 0)
    g = ImageDraw.Draw(m)
    # Une bulle de conversation : un disque et sa pointe.
    g.ellipse((4, 2, 44, 42), fill=255)
    g.polygon([(14, 36), (14, 52), (30, 36)], fill=255)

    nappe = Image.new("L", (largeur + 240, hauteur + 240), 0)
    for y in range(0, hauteur + 240, tuile):
        for x in range(0, largeur + 240, tuile):
            nappe.paste(m, (x, y))
    nappe = nappe.rotate(8, resample=Image.BICUBIC)

    couche = Image.new("RGBA", nappe.size, BLAN + (0,))
    couche.putalpha(nappe.point(lambda v: int(v * opacite)))
    _motif = couche
    return couche


def aplat(img: Image.Image, t: float, couleur=NWI, avec_motif: bool = True) -> None:
    """Le fond uni des stories, avec sa dérive."""
    img.paste(Image.new("RGB", img.size, couleur), (0, 0))
    if avec_motif:
        n = motif(*img.size)
        d = -int((t * 3.1) % 120)
        img.paste(n, (d - 120, d - 120), n)


def degrade(img: Image.Image, t: float, haut=DEG_HAUT, bas=DEG_BAS, avec_motif: bool = True) -> None:
    """Le dégradé de la story « un seul lien », motif compris."""
    largeur, hauteur = img.size
    bande = Image.new("RGB", (1, hauteur))
    p = bande.load()
    for y in range(hauteur):
        k = y / hauteur
        p[0, y] = tuple(round(haut[i] + (bas[i] - haut[i]) * k) for i in range(3))
    img.paste(bande.resize((largeur, hauteur)), (0, 0))
    if avec_motif:
        n = motif(largeur, hauteur, 0.07)
        d = -int((t * 3.1) % 120)
        img.paste(n, (d - 120, d - 120), n)
