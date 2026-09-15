"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { MutualFundTopPerformersPage } from "../../../../client/[id]/MutualFundTopPerformersPage";
import { normalizeMutualFundCategoryId } from "../../../../client/[id]/mutual-fund-data";
import { useSectionBack } from "@/hooks/use-section-back";

export default function MutualFundTopPerformersRoute({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId: rawCategoryId } = use(params);
  const categoryId = normalizeMutualFundCategoryId(decodeURIComponent(rawCategoryId));
  const router = useRouter();
  const goBack = useSectionBack();

  return (
    <MutualFundTopPerformersPage
      categoryId={categoryId}
      onBack={goBack}
      onFundSelect={(fundId) =>
        router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`)
      }
    />
  );
}
