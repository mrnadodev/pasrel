import { Apropo } from "@/components/Apropo";
import { DocTitle } from "@/components/DocTitle";
import { TITRES } from "@/lib/i18n/titres";

// L'histoire de PASRÈL, publique. Le code l'annonçait depuis le changement de
// nom — la signature « philosophie » était décrite comme destinée à la page
// d'histoire, et n'était utilisée nulle part.
export default function AproposPage() {
  return (
    <>
      <DocTitle titres={TITRES.apropo} />
      <Apropo />
    </>
  );
}

export const metadata = {
  title: "L'histoire · PASRÈL",
  description:
    "En Haïti, une passerelle n'est pas un monument. C'est quelques planches jetées sur un ravin, posées par ceux qui doivent le traverser.",
};
