"use client";

import { RoboAdvisoryDetail } from "../../client/[id]/RoboAdvisoryDetail";
import { useSectionBack } from "@/hooks/use-section-back";

export default function RoboAdvisoryDetailPage() {
  const goBack = useSectionBack();
  return <RoboAdvisoryDetail onBack={goBack} />;
}
