"""Transcrit un fichier audio ou video, et en rend un SRT.

À quoi ça sert ici. Le film « Pasrèl, la traversée » et le spot produit
attendent tous deux une voix réelle, créolophone — aucun moteur de synthèse
ne parle créole. Une fois cette voix enregistrée, il faut deux choses :

  · vérifier qu'elle tient dans les plans. Le script est minuté à la seconde ;
    une phrase qui déborde de deux secondes décale tout ce qui suit.
  · en tirer des sous-titres. La moitié des gens regardent sans le son.

Whisper transcrit, il ne parle pas : ce fichier ne fabrique aucune voix.

    .venv\\Scripts\\python.exe scripts/transcrire.py <fichier> [--modele small] [--langue fr]

Le modèle se télécharge au premier usage, puis reste en cache. « small »
suffit pour du français propre ; « medium » tient mieux un accent marqué, et
coûte trois fois plus de temps sur processeur.

Le créole haïtien n'est pas dans les langues de Whisper. Une voix créole
ressortira transcrite en français approximatif : utile pour caler le temps,
inutilisable comme sous-titre. Pour les sous-titres créoles, il faut partir
du script écrit — il existe déjà, dans les trois langues.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def lire_audio(chemin: Path, taux: int = 16000):
    """Décode un média en un signal mono 16 kHz, prêt pour Whisper.

    Pourquoi ne pas laisser faster-whisper le faire. Sa version 1.2.1 — la
    dernière — appelle `av.open(..., metadata_errors=...)`, un argument que
    PyAV a supprimé en version 19. Et PyAV ne peut pas être rétrogradé ici :
    les versions antérieures ne publient pas de roue pour Python 3.13, et les
    compiler demanderait les sources de ffmpeg.

    On décode donc nous-mêmes, avec l'API actuelle. Le tableau obtenu est ce
    que `transcribe()` accepte directement, et le script cesse de dépendre
    d'un détail interne qui a déjà cassé une fois.
    """
    import av
    import numpy as np
    from av.audio.resampler import AudioResampler

    with av.open(str(chemin)) as conteneur:
        flux = next((s for s in conteneur.streams if s.type == "audio"), None)
        if flux is None:
            raise SystemExit(f"aucune piste audio dans {chemin.name}")
        flux.thread_type = "AUTO"

        reechantillonneur = AudioResampler(format="flt", layout="mono", rate=taux)
        morceaux = []
        for trame in conteneur.decode(flux):
            for sortie in reechantillonneur.resample(trame):
                morceaux.append(sortie.to_ndarray().reshape(-1))
        # Vider ce qui reste dans le rééchantillonneur.
        for sortie in reechantillonneur.resample(None):
            morceaux.append(sortie.to_ndarray().reshape(-1))

    if not morceaux:
        raise SystemExit(f"rien à décoder dans {chemin.name}")
    return np.concatenate(morceaux).astype("float32")


def horodatage(secondes: float) -> str:
    """Le format que SRT attend : HH:MM:SS,mmm."""
    ms = int(round(secondes * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> int:
    a = argparse.ArgumentParser(description="Transcrit un media et ecrit un SRT a cote.")
    a.add_argument("fichier", type=Path)
    a.add_argument("--modele", default="small", help="tiny, base, small, medium, large-v3")
    a.add_argument("--langue", default=None, help="fr, en… ; detectee si absente")
    a.add_argument("--sortie", type=Path, default=None)
    opt = a.parse_args()

    if not opt.fichier.exists():
        print(f"introuvable : {opt.fichier}", file=sys.stderr)
        return 2

    from faster_whisper import WhisperModel

    # int8 sur processeur : trois fois plus rapide que float32, pour une
    # différence qu'on n'entend pas sur de la parole.
    modele = WhisperModel(opt.modele, device="cpu", compute_type="int8")

    signal = lire_audio(opt.fichier)

    segments, info = modele.transcribe(
        signal,
        language=opt.langue,
        vad_filter=True,          # coupe les silences : moins d'hallucinations
        beam_size=5,
    )

    print(f"langue detectee : {info.language} ({info.language_probability:.0%})")
    print(f"duree : {info.duration:.1f} s")
    print("")

    srt = opt.sortie or opt.fichier.with_suffix(".srt")
    lignes: list[str] = []
    for i, seg in enumerate(segments, start=1):
        texte = seg.text.strip()
        if not texte:
            continue
        print(f"[{horodatage(seg.start)} → {horodatage(seg.end)}] {texte}")
        lignes += [str(i), f"{horodatage(seg.start)} --> {horodatage(seg.end)}", texte, ""]

    srt.write_text("\n".join(lignes), encoding="utf-8")
    print("")
    print(f"sous-titres : {srt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
