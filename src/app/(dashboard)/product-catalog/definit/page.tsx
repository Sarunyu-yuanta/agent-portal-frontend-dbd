"use client";

import { DefinitDetail } from "../../client/[id]/DefinitDetail";
import { useSectionBack } from "@/hooks/use-section-back";

export default function DefinitDetailPage() {
  const goBack = useSectionBack();
  return <DefinitDetail onBack={goBack} />;
}
