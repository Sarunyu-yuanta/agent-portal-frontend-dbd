"use client";

import { Button, Tag } from "@sarunyu/system-one";
import { ArrowSquareOutIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { AdvisoryAccountStatus, AdvisoryCta, PlanSuitability } from "./portfolio-advisory-client";

/** Whether the client already holds an account with this service. */
export function AdvisoryAccountTag({ status }: { status: AdvisoryAccountStatus }) {
  const open = status === "open";
  return <Tag text={open ? "เปิดบัญชีแล้ว" : "ยังไม่เปิดบัญชี"} variant={open ? "green" : "gray"} size="small" />;
}

export function PlanSuitabilityBadge({ suitability }: { suitability: PlanSuitability }) {
  const suitable = suitability === "suitable";
  const Icon = suitable ? CheckCircleIcon : WarningCircleIcon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] leading-4 ${
        suitable ? "bg-[#dcfce7] text-[#016630]" : "bg-[#fef3c6] text-[#973c00]"
      }`}
    >
      <Icon size={12} weight="fill" />
      {suitable ? "เหมาะกับลูกค้า" : "เกินระดับความเสี่ยง"}
    </span>
  );
}

/**
 * The per-plan action. Opens the external destination in a new tab so the IC
 * keeps the plan list they were comparing from.
 */
export function AdvisoryCtaButton({ cta, className }: { cta: AdvisoryCta; className?: string }) {
  return (
    <Button
      variant={cta.variant}
      size="lg"
      className={className}
      rightIcon={<ArrowSquareOutIcon size={18} />}
      onClick={() => window.open(cta.href, "_blank", "noopener,noreferrer")}
    >
      {cta.label}
    </Button>
  );
}
