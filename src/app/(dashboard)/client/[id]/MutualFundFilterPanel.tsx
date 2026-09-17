"use client";

import { useState } from "react";
import { BottomSheet, Modal, Button } from "@sarunyu/system-one";
import { XIcon } from "@phosphor-icons/react";
import {
  DIVIDEND_POLICY_OPTIONS,
  FILTER_CATEGORY_OPTIONS,
  FUND_MANAGEMENT_COMPANIES,
  FUND_RISK_LEVELS,
  INVESTMENT_POLICY_OPTIONS,
  TAX_SAVING_FUND_TYPES,
  getFundCategoryIds,
  getFundDividendPolicy,
  getFundInvestmentPolicy,
  getFundManagementCompanyId,
  getFundTaxSavingType,
  type MutualFund,
} from "./mutual-fund-data";
import { MF_ASSETS } from "./mutual-fund-assets";

export type MutualFundFilterState = {
  categories: string[];
  taxTypes: string[];
  dividendPolicies: string[];
  investmentPolicies: string[];
  managementCompanies: string[];
  riskLevels: number[];
};

export const EMPTY_FILTER_STATE: MutualFundFilterState = {
  categories: [],
  taxTypes: [],
  dividendPolicies: [],
  investmentPolicies: [],
  managementCompanies: [],
  riskLevels: [],
};

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function isEmptyFilterState(filter: MutualFundFilterState): boolean {
  return (
    filter.categories.length === 0 &&
    filter.taxTypes.length === 0 &&
    filter.dividendPolicies.length === 0 &&
    filter.investmentPolicies.length === 0 &&
    filter.managementCompanies.length === 0 &&
    filter.riskLevels.length === 0
  );
}

/** Figma 40544:772211 (no chips → full catalog) / 40544:772630 (no matches → empty state). */
export function applyMutualFundFilter(funds: MutualFund[], filter: MutualFundFilterState): MutualFund[] {
  if (isEmptyFilterState(filter)) return funds;

  return funds.filter((fund) => {
    if (filter.categories.length > 0) {
      const categories = getFundCategoryIds(fund.id);
      if (!filter.categories.some((c) => categories.includes(c))) return false;
    }
    if (filter.taxTypes.length > 0) {
      const taxType = getFundTaxSavingType(fund.id);
      if (!taxType || !filter.taxTypes.includes(taxType)) return false;
    }
    if (filter.dividendPolicies.length > 0 && !filter.dividendPolicies.includes(getFundDividendPolicy(fund.id))) {
      return false;
    }
    if (
      filter.investmentPolicies.length > 0 &&
      !filter.investmentPolicies.includes(getFundInvestmentPolicy(fund.id))
    ) {
      return false;
    }
    if (
      filter.managementCompanies.length > 0 &&
      !filter.managementCompanies.includes(getFundManagementCompanyId(fund.id))
    ) {
      return false;
    }
    if (filter.riskLevels.length > 0 && !filter.riskLevels.includes(fund.risk)) {
      return false;
    }
    return true;
  });
}

function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm leading-5 transition-colors ${
        active
          ? "border-[#0a6ee7] bg-[#f3f8fe] text-[#0a6ee7] hover:bg-[#e4f0fd]!"
          : "border-black/10 bg-white text-[#4a5565] hover:bg-black/[0.03]!"
      }`}
    >
      {icon ? (
        <span className="relative size-5 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} alt="" className="absolute inset-0 block size-full object-cover" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

function FilterSection({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-sm font-bold leading-5 text-[#101828]">{title}</p>
        <Button variant="plain" size="xs" onClick={onClear} className="shrink-0">
          ล้าง
        </Button>
      </div>
      {children}
    </div>
  );
}

function FilterDivider() {
  return <div className="h-px w-full bg-black/10" />;
}

function MutualFundFilterContent({
  draft,
  setDraft,
}: {
  draft: MutualFundFilterState;
  setDraft: (updater: (prev: MutualFundFilterState) => MutualFundFilterState) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <FilterSection title="หมวดหมู่" onClear={() => setDraft((prev) => ({ ...prev, categories: [] }))}>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {FILTER_CATEGORY_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              label={option.label}
              active={draft.categories.includes(option.id)}
              onClick={() =>
                setDraft((prev) => ({ ...prev, categories: toggleValue(prev.categories, option.id) }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection title="กองทุนลดหย่อนภาษี" onClear={() => setDraft((prev) => ({ ...prev, taxTypes: [] }))}>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {TAX_SAVING_FUND_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={type}
              active={draft.taxTypes.includes(type)}
              onClick={() => setDraft((prev) => ({ ...prev, taxTypes: toggleValue(prev.taxTypes, type) }))}
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection
        title="นโยบายการจ่ายปันผล"
        onClear={() => setDraft((prev) => ({ ...prev, dividendPolicies: [] }))}
      >
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {DIVIDEND_POLICY_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={draft.dividendPolicies.includes(option)}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  dividendPolicies: toggleValue(prev.dividendPolicies, option),
                }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection
        title="นโยบายการลงทุน"
        onClear={() => setDraft((prev) => ({ ...prev, investmentPolicies: [] }))}
      >
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {INVESTMENT_POLICY_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={draft.investmentPolicies.includes(option)}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  investmentPolicies: toggleValue(prev.investmentPolicies, option),
                }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection
        title="บริษัทจัดการกองทุน"
        onClear={() => setDraft((prev) => ({ ...prev, managementCompanies: [] }))}
      >
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {FUND_MANAGEMENT_COMPANIES.map((company) => (
            <FilterChip
              key={company.id}
              label={company.label}
              icon={MF_ASSETS.amcLogo[company.id as keyof typeof MF_ASSETS.amcLogo]}
              active={draft.managementCompanies.includes(company.id)}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  managementCompanies: toggleValue(prev.managementCompanies, company.id),
                }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection title="ระดับความเสี่ยง" onClear={() => setDraft((prev) => ({ ...prev, riskLevels: [] }))}>
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {FUND_RISK_LEVELS.map((level) => (
            <FilterChip
              key={level}
              label={`Level ${level}`}
              active={draft.riskLevels.includes(level)}
              onClick={() =>
                setDraft((prev) => ({ ...prev, riskLevels: toggleValue(prev.riskLevels, level) }))
              }
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterFooter({
  onClear,
  onApply,
}: {
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex w-full gap-4">
      <Button variant="outline" size="xl" className="flex-1" onClick={onClear}>
        ล้างทั้งหมด
      </Button>
      <Button variant="primary" size="xl" className="flex-1" onClick={onApply}>
        ตกลง
      </Button>
    </div>
  );
}

/** Figma 39910:727252 — "ตัวกรอง", mobile bottom sheet. */
export function MutualFundFilterBottomSheet({
  open,
  initialState,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  initialState: MutualFundFilterState;
  onOpenChange: (open: boolean) => void;
  onApply: (state: MutualFundFilterState) => void;
}) {
  const [draft, setDraft] = useState(initialState);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initialState);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="ตัวกรอง"
      showHandle
      showHeader
      rightSide="icon"
      rightIcon={<XIcon size={18} weight="bold" />}
      contentClassName="mx-[-16px] flex max-h-[calc(100dvh-8rem)] flex-col gap-6 overflow-y-auto px-4 pb-4"
    >
      <div className="flex w-full justify-end">
        <Button variant="plain" size="xs" onClick={() => setDraft(EMPTY_FILTER_STATE)}>
          ล้างทั้งหมด
        </Button>
      </div>
      <MutualFundFilterContent draft={draft} setDraft={setDraft} />
      <FilterFooter
        onClear={() => setDraft(EMPTY_FILTER_STATE)}
        onApply={() => {
          onApply(draft);
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}

/** Figma 39910:727252 — "ตัวกรอง", desktop centered modal. */
export function MutualFundFilterModal({
  open,
  initialState,
  onClose,
  onApply,
}: {
  open: boolean;
  initialState: MutualFundFilterState;
  onClose: () => void;
  onApply: (state: MutualFundFilterState) => void;
}) {
  const [draft, setDraft] = useState(initialState);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initialState);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
        <div className="absolute right-12 top-4 z-10">
          <Button variant="plain" size="xs" onClick={() => setDraft(EMPTY_FILTER_STATE)}>
            ล้างทั้งหมด
          </Button>
        </div>
        <Modal
          variant="content"
          title="ตัวกรอง"
          showClose
          onClose={onClose}
          className="!max-w-[726px] w-[calc(100vw-3rem)]"
        >
          <div className="mx-[-16px] max-h-[70vh] overflow-y-auto px-4 pb-2">
            <div className="flex w-full flex-col gap-6">
              <MutualFundFilterContent draft={draft} setDraft={setDraft} />
            </div>
          </div>
          <div className="pt-4">
            <FilterFooter
              onClear={() => setDraft(EMPTY_FILTER_STATE)}
              onApply={() => {
                onApply(draft);
                onClose();
              }}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
