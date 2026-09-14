"use client";

import { useState } from "react";
import { MutualFundInsightsSection } from "./MutualFundInsightsSection";
import { MutualFundQuickActions } from "./MutualFundQuickActions";
import { MutualFundThemesSection } from "./MutualFundThemesSection";
import { MutualFundTopPerformersSection } from "./MutualFundTopPerformersSection";
import type { MutualFundCategoryId } from "./mutual-fund-data";
import { useMutualFundCatalog } from "@/hooks/use-catalog";

export function MutualFundTab({ onFundSelect }: { onFundSelect?: (fundId: string) => void }) {
  const { data } = useMutualFundCatalog();
  const [categoryId, setCategoryId] = useState<MutualFundCategoryId>("global-equity");
  const funds = data.topPerformers[categoryId] ?? data.topPerformers["global-equity"] ?? [];

  const topPerformers = (
    <MutualFundTopPerformersSection
      categoryId={categoryId}
      onCategoryChange={setCategoryId}
      funds={funds}
      onFundSelect={onFundSelect}
    />
  );

  const insights = <MutualFundInsightsSection insights={data.insights} />;

  return (
    <div className="flex w-full flex-col bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 md:px-8 lg:px-6">
        {/* Figma 40135:224236 — mobile: performers → quick actions → insights */}
        <div className="flex flex-col gap-2 lg:hidden">
          {topPerformers}
          <MutualFundQuickActions className="pt-3" />
          <div className="mt-3">{insights}</div>
        </div>

        {/* Figma 40118:77234 — desktop: two columns */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16">
          {topPerformers}
          {insights}
        </div>
      </div>

      <div className="mx-auto mt-3 w-full max-w-[1280px] px-4 md:px-8 lg:mt-6 lg:px-6">
        <MutualFundThemesSection themes={data.themes} onFundSelect={onFundSelect} />
      </div>
    </div>
  );
}
