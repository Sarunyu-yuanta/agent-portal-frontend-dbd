"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  ClockIcon,
  HeartIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import type { MutualFundDetail as MutualFundDetailData } from "./mutual-fund-data";
import { MF_ASSETS, mutualFundRiskMeterSrc } from "./mutual-fund-assets";
import { MutualFundInvestmentPolicyModal } from "./MutualFundInvestmentPolicyModal";
import {
  DividendHistoryPreview,
  MutualFundDividendHistoryModal,
} from "./MutualFundDividendHistoryModal";
import { AllocationDonut } from "@/components/allocation-donut";

const DETAIL_TABS = ["ภาพรวม", "ผลตอบแทน", "สัดส่วนการลงทุน", "ข้อมูลกองทุน"] as const;

const CHART_RANGES = ["YTD", "1W", "1M", "3M", "6M", "1Y", "5Y", "MAX"] as const;

type DetailTab = (typeof DETAIL_TABS)[number];
type ChartRange = (typeof CHART_RANGES)[number];

function RiskTag({ risk }: { risk: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <span className="relative size-5 shrink-0 overflow-clip">
        <span className="absolute bottom-[29.17%] left-[8.33%] right-[8.33%] top-1/4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutualFundRiskMeterSrc(risk)}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <span className="text-xs font-semibold leading-4 text-[#4a5565] whitespace-nowrap">
        risk: {risk}
      </span>
    </span>
  );
}

function FxRiskTag({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <Image src={MF_ASSETS.coinsIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span className="text-xs font-semibold leading-4 text-[#4a5565] whitespace-nowrap">{label}</span>
    </span>
  );
}

function CreditCardTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <span className="relative size-5 shrink-0 overflow-clip">
        <span className="absolute bottom-[29.17%] left-[8.33%] right-[8.33%] top-1/4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutualFundRiskMeterSrc(4)}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <span className="text-xs font-semibold leading-4 text-[#4a5565] whitespace-nowrap">Credit Card</span>
    </span>
  );
}

function ReturnCell({ period, value }: { period: string; value: string }) {
  const isPositive = value.startsWith("+");
  const color = isPositive ? "#008236" : value.startsWith("-") ? "#fb2c36" : "#101828";

  return (
    <div className="flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg bg-[#f9fafb] p-1.5">
      <span className="text-sm font-bold leading-5" style={{ color }}>
        {value}
      </span>
      <span className="text-xs leading-4 text-black text-center">{period}</span>
    </div>
  );
}

function FeeCell({
  label,
  sublabel,
  value,
}: {
  label: string;
  sublabel: string;
  value: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md bg-[#f9fafb] p-1.5">
      <span className="text-sm leading-5 text-[#4a5565] text-center">{label}</span>
      <span className="text-[9px] leading-[14px] text-[#4a5565] text-center">{sublabel}</span>
      <span className="text-sm font-bold leading-5 text-[#101828]">{value}</span>
    </div>
  );
}

function FundInfoRow({ label, value, link }: { label: string; value: ReactNode; link?: boolean }) {
  return (
    <div className="flex w-full border-b border-black/10 last:border-b-0">
      <div className="flex min-h-12 flex-1 items-center px-4 py-3.5">
        <span className="text-sm leading-5 text-[#101828]">{label}</span>
      </div>
      <div className="flex min-h-12 flex-1 items-center px-4 py-3.5">
        {link ? (
          <span className="text-sm leading-5 text-[#0a6ee7]">{value}</span>
        ) : (
          <span className="text-sm leading-5 text-[#4a5565]">{value}</span>
        )}
      </div>
    </div>
  );
}

function PerformanceChart() {
  return (
    <div className="relative h-[227px] w-full">
      <div className="absolute inset-x-0 bottom-0 top-3 flex flex-col justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-px w-full bg-black/[0.06]" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-2.5 flex h-[144px] items-end justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MF_ASSETS.detailChartArea}
          alt=""
          className="absolute inset-x-0 bottom-0 h-[117px] w-full max-w-none object-fill"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MF_ASSETS.detailChartLine}
          alt=""
          className="relative z-[1] h-[144px] w-full max-w-none object-fill"
        />
      </div>
      <div className="absolute left-1/2 top-7 z-[2] flex -translate-x-1/2 flex-col items-center gap-1">
        <div className="flex min-w-[48px] flex-col items-start rounded-2xl bg-white p-1.5 shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]">
          <p className="w-full text-center text-xs leading-4 text-black/40">3 May 2025</p>
          <p className="w-full text-center text-sm leading-5 text-black/75">
            55.00 <span className="text-black/40">THB</span>
          </p>
        </div>
        <span className="size-3.5 rounded-full border-2 border-white bg-[#f5212d] shadow-[0px_4px_4px_rgba(28,25,23,0.03),0px_8px_8px_rgba(28,25,23,0.02)]" />
      </div>
      <div className="absolute inset-x-4 bottom-0 flex justify-between text-xs leading-4 text-black/40 md:inset-x-8 lg:inset-x-4">
        {["13:30", "13:45", "14:00", "14:15", "14:30", "14:45", "15:00"].map((t) => (
          <span key={t} className="flex-1 text-center">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartRangeSelector({
  active,
  onChange,
}: {
  active: ChartRange;
  onChange: (range: ChartRange) => void;
}) {
  return (
    <div className="flex w-full rounded-full bg-[#f3f3f3] p-1">
      {CHART_RANGES.map((range) => {
        const selected = active === range;
        return (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range)}
            className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs font-bold leading-4 transition-colors ${
              selected
                ? "bg-white text-[#292524] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                : "text-black/75"
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}

function OverviewContent({ fund }: { fund: MutualFundDetailData }) {
  const [chartRange, setChartRange] = useState<ChartRange>("YTD");
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const returnRows = [
    fund.historicalReturns.slice(0, 3),
    fund.historicalReturns.slice(3, 6),
  ];

  return (
    <>
      <div className="w-full py-5">
        <PerformanceChart />
        <div className="mx-auto mt-6 w-full max-w-[768px] lg:px-0">
          <ChartRangeSelector active={chartRange} onChange={setChartRange} />
        </div>
      </div>

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-6 text-black">ผลตอบแทนย้อนหลัง</h2>
        <div className="flex flex-col gap-2">
          {returnRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((item) => (
                <ReturnCell key={item.period} period={item.period} value={item.value} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-6 text-[#101828]">นโยบายการลงทุน</h2>
        <div className="flex flex-col items-end gap-2.5 rounded-lg border border-black/10 p-3">
          <p className="w-full text-sm leading-5 text-[#101828] line-clamp-4">{fund.investmentPolicy}</p>
          <button
            type="button"
            className="border-none bg-transparent p-0 text-sm leading-5 text-[#2b7fff] cursor-pointer"
            onClick={() => setPolicyModalOpen(true)}
          >
            อ่านเพิ่มเติม
          </button>
        </div>
      </section>

      <MutualFundInvestmentPolicyModal
        open={policyModalOpen}
        policy={fund.investmentPolicy}
        onClose={() => setPolicyModalOpen(false)}
      />

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-6 text-[#101828]">ค่าธรรมเนียม</h2>
        <div className="flex gap-2.5 rounded-lg border border-black/10 p-3">
          <FeeCell label="ซื้อ" sublabel="(Front-end Fee)" value={fund.fees.frontEnd} />
          <FeeCell label="ขาย" sublabel="(Front-end Fee)" value={fund.fees.backEnd} />
          <FeeCell label="จัดการ" sublabel="(Front-end Fee)" value={fund.fees.management} />
        </div>
      </section>

      {fund.dividend && (
        <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
          <h2 className="text-base font-bold leading-6 text-[#101828]">การจ่ายปันผลครั้งล่าสุด</h2>
          <div className="rounded-lg border border-black/10 p-3">
            <div className="flex gap-2.5">
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-xs leading-4 text-[#4a5565] text-center">วันที่ปิดสมุด</span>
                <span className="text-sm font-bold leading-5 text-[#101828]">{fund.dividend.bookCloseDate}</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-xs leading-4 text-[#4a5565] text-center">วันที่จ่าย</span>
                <span className="text-sm font-bold leading-5 text-[#101828]">{fund.dividend.paymentDate}</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-xs leading-4 text-[#4a5565] text-center">บาท/หน่วย</span>
                <span className="text-sm font-bold leading-5 text-[#101828]">{fund.dividend.amountPerUnit}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-6 text-[#101828]">รายละเอียดกองทุน</h2>
        <div className="overflow-hidden rounded-lg border border-black/10">
          <FundInfoRow
            label="หนังสือชี้ชวน"
            link
            value={
              <span className="inline-flex items-center gap-0.5">
                <Image src={MF_ASSETS.filePdfIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
                ดูหนังสือชี้ชวน
              </span>
            }
          />
          <FundInfoRow label="ชื่อกองทุน" value={fund.name} />
          <FundInfoRow label="บลจ." value={fund.fundInfo.managementCompany} />
          <FundInfoRow label="ประเภทกอง" value={fund.fundInfo.fundType} />
          <FundInfoRow label="สิทธิประโยชน์ทางภาษี" value={fund.fundInfo.taxBenefit} />
          <FundInfoRow label="ลงทุนในต่างประเทศ" value={fund.fundInfo.foreignInvestment} />
          <FundInfoRow label="ความเสี่ยงอัตราแลก เปลี่ยน" value={fund.fundInfo.fxRiskPolicy} />
          <FundInfoRow label="ค่าความเสี่ยง" value={String(fund.fundInfo.riskScore)} />
          <FundInfoRow label="นโยบายการจ่ายปันผล" value={fund.fundInfo.dividendPolicy} />
          <FundInfoRow label="นโยบายค่าเงิน" value={fund.fundInfo.currencyPolicy} />
          <FundInfoRow label="ค่าธรรมเนียมการจัดการ" value={fund.fundInfo.managementFee} />
          <FundInfoRow label="ขั้นต่ำการลงทุน" value={fund.fundInfo.minimumInvestment} />
          <FundInfoRow label="วันที่จดทะเบียนกองทุน" value={fund.fundInfo.registrationDate} />
          <FundInfoRow label="มูลค่าทรัพย์สินสุทธิ" value={fund.fundInfo.netAssetValue} />
        </div>
      </section>
    </>
  );
}

function valueColor(value: string): string {
  if (value.startsWith("+")) return "#008236";
  if (value.startsWith("-") && value !== "-") return "#c10007";
  return "#101828";
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-base font-bold leading-6 text-[#101828] ${className}`}>{children}</h2>
  );
}

function DataTableHeader({ columns }: { columns: { label: string; align?: "left" | "center" | "right" }[] }) {
  return (
    <div className="flex w-full border-b border-black/10">
      {columns.map((col) => (
        <div
          key={col.label}
          className={`flex flex-1 items-center px-4 py-3 ${
            col.align === "center" ? "justify-center text-center" : col.align === "right" ? "justify-end text-right" : ""
          }`}
        >
          <span className="text-xs leading-4 text-[#6a7282]">{col.label}</span>
        </div>
      ))}
    </div>
  );
}

function DataTableCell({
  value,
  align = "left",
  striped,
}: {
  value: string;
  align?: "left" | "center" | "right";
  striped?: boolean;
}) {
  return (
    <div
      className={`flex h-[38px] flex-1 items-center border-b border-black/10 px-4 py-3.5 last:border-b-0 ${
        striped ? "bg-[#f9fafb]" : "bg-white"
      } ${align === "center" ? "justify-center text-center" : align === "right" ? "justify-end text-right" : ""}`}
    >
      <span className="text-sm leading-5" style={{ color: valueColor(value) }}>
        {value}
      </span>
    </div>
  );
}

function KeyValueBox({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-black/10 p-3">
      {rows.map((row) => (
        <div key={row.label} className="flex w-full items-end gap-2">
          <span className="flex-1 text-sm leading-5 text-[#4a5565]">{row.label}</span>
          <span className="shrink-0 text-sm leading-5 text-[#101828] whitespace-nowrap">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Figma 39824:512312 — fee table with fixed value column widths on mobile */
function FeeDetailsTable({ rows }: { rows: { label: string; actual: string; maximum: string }[] }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full">
        <div className="flex h-12 min-w-0 flex-1 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-5 text-[#4a5565]">รายการค่าธรรมเนียม</span>
        </div>
        <div className="flex h-12 w-20 shrink-0 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-5 text-[#4a5565]">เก็บจริง</span>
        </div>
        <div className="flex h-12 w-[81px] shrink-0 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-5 text-[#4a5565]">ไม่เกิน</span>
        </div>
      </div>
      {rows.map((row, index) => {
        const striped = index % 2 === 0;
        const bg = striped ? "bg-[#f9fafb]" : "bg-white";
        const isLast = index === rows.length - 1;
        const rowBorder = isLast ? "" : "border-b border-black/10";

        return (
          <div key={row.label} className="flex w-full">
            <div className={`flex min-h-12 min-w-0 flex-1 items-center px-4 py-3.5 ${rowBorder} ${bg}`}>
              <span className="text-sm leading-5 text-[#101828]">{row.label}</span>
            </div>
            <div className={`flex min-h-12 w-20 shrink-0 items-center px-4 py-3.5 ${rowBorder} ${bg}`}>
              <span className="text-sm leading-5 text-[#101828]">{row.actual}</span>
            </div>
            <div className={`flex min-h-12 w-[81px] shrink-0 items-center px-4 py-3.5 ${rowBorder} ${bg}`}>
              <span className="text-sm leading-5 text-[#101828]">{row.maximum}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AllocationSection({
  title,
  slices,
}: {
  title: string;
  slices: { label: string; percent: number; color?: string }[];
}) {
  if (slices.length === 0) {
    return (
      <section className="flex w-full flex-col gap-3 bg-white py-4 lg:bg-transparent">
        <SectionTitle className="lg:px-0">{title}</SectionTitle>
        <p className="text-sm leading-5 text-[#6a7282] lg:px-0">ไม่มีข้อมูล</p>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-3 bg-white py-4 lg:bg-transparent">
      <SectionTitle className="lg:px-0">{title}</SectionTitle>
      <div className="flex flex-col items-center gap-3 py-3">
        <AllocationDonut slices={slices} size={180} />
        <div className="flex w-full flex-col">
          {slices.map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center gap-2 px-6 py-2 lg:px-6">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color ?? ["#074EA4", "#51A2FF", "#A3B3FF"][index % 3] }}
                />
                <span className="flex-1 text-sm leading-5 text-[#4a5565]">{item.label}</span>
                <span className="text-sm font-bold leading-5 text-[#101828] whitespace-nowrap">
                  {item.percent}%
                </span>
              </div>
              {index < slices.length - 1 && (
                <div className="mx-6 h-px bg-black/10 lg:mx-6" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PerformanceContent({ fund }: { fund: MutualFundDetailData }) {
  const [dividendModalOpen, setDividendModalOpen] = useState(false);

  return (
    <>
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>ผลตอบแทนย้อนหลัง</SectionTitle>
        <div className="overflow-x-auto md:overflow-visible">
        <div className="min-w-[520px] overflow-hidden rounded-lg border border-black/10 md:min-w-0">
          <DataTableHeader
            columns={[
              { label: "ช่วงเวลา" },
              { label: "ผลตอบแทน" },
              { label: "ความผันผวนกองทุน" },
              { label: "Maximum Drawdown" },
            ]}
          />
          {fund.performanceReturns.map((row, index) => (
            <div key={row.period} className="flex w-full">
              <DataTableCell value={row.period} striped={index % 2 === 0} />
              <DataTableCell value={row.return} striped={index % 2 === 0} />
              <DataTableCell value={row.volatility} striped={index % 2 === 0} />
              <DataTableCell value={row.maxDrawdown} striped={index % 2 === 0} />
            </div>
          ))}
        </div>
        </div>
      </section>

      {fund.dividendHistory.length > 0 && (
        <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
          <SectionTitle>ประวัติการจ่ายปันผล</SectionTitle>
          <DividendHistoryPreview
            rows={fund.dividendHistory}
            onViewAll={() => setDividendModalOpen(true)}
          />
        </section>
      )}

      <MutualFundDividendHistoryModal
        open={dividendModalOpen}
        rows={fund.dividendHistory}
        onClose={() => setDividendModalOpen(false)}
      />
    </>
  );
}

function AllocationContent({ fund }: { fund: MutualFundDetailData }) {
  return (
    <div className="flex flex-col gap-2.5 bg-[#f9fafb] lg:bg-transparent">
      <AllocationSection title="หลักทรัพย์ 5 อันดับแรก" slices={fund.topHoldings} />
      <AllocationSection title="สัดส่วนการลงทุน" slices={fund.assetAllocation} />
    </div>
  );
}

function FundInfoContent({ fund }: { fund: MutualFundDetailData }) {
  const { tradingInfo } = fund;

  return (
    <>
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>มูลค่าขั้นต่ำในการซื้อขาย</SectionTitle>
        <KeyValueBox
          rows={[
            { label: "มูลค่าขั้นต่ำของการซื้อครั้งแรก", value: tradingInfo.minInitialPurchase },
            { label: "มูลค่าขั้นต่ำของการซื้อครั้งถัดไป", value: tradingInfo.minSubsequentPurchase },
            { label: "มูลค่าขายขั้นต่ำ", value: tradingInfo.minRedemption },
          ]}
        />
      </section>

      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>เวลาทำรายการ</SectionTitle>
        <KeyValueBox
          rows={[
            { label: "เวลาปิดรับคำสั่งซื้อ", value: tradingInfo.purchaseCutoff },
            { label: "เวลาปิดรับคำสั่งขาย", value: tradingInfo.redemptionCutoff },
            { label: "วันที่จะได้รับเงิน", value: tradingInfo.settlementDays },
          ]}
        />
      </section>

      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>ค่าธรรมเนียม</SectionTitle>
        <FeeDetailsTable rows={fund.feeDetails} />
      </section>
    </>
  );
}

function DetailBody({ fund, activeTab }: { fund: MutualFundDetailData; activeTab: DetailTab }) {
  if (activeTab === "ภาพรวม") return <OverviewContent fund={fund} />;
  if (activeTab === "ผลตอบแทน") return <PerformanceContent fund={fund} />;
  if (activeTab === "สัดส่วนการลงทุน") return <AllocationContent fund={fund} />;
  return <FundInfoContent fund={fund} />;
}

export function MutualFundDetail({
  fund,
  onBack,
}: {
  fund: MutualFundDetailData;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("ภาพรวม");

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [fund.id]);

  const isPositive = fund.changePct.startsWith("+");

  return (
    <div className="flex w-full flex-col pb-20 max-lg:bg-white lg:bg-[#f9fafb] lg:pt-2">
      <div className="mx-auto flex w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:px-0">
        <div className="max-lg:sticky max-lg:top-0 max-lg:z-30 flex h-12 items-center gap-2 max-lg:border-b max-lg:border-black/10 max-lg:bg-white py-2 max-lg:px-0 lg:h-auto lg:min-h-[46px] lg:py-2 lg:pr-2">
          <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
            <ArrowLeftIcon size={18} />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <h1 className="shrink-0 text-base font-bold leading-6 text-[#101828]">{fund.symbol}</h1>
            <p className="hidden min-w-0 flex-1 truncate text-sm leading-5 text-[#4a5565] lg:block">
              {fund.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <MagnifyingGlassIcon size={24} className="text-[#101828]" />
            <HeartIcon size={24} className="text-[#101828]" />
          </div>
        </div>

        <div className="flex w-full flex-col lg:rounded-t-3xl lg:bg-white lg:px-14 lg:py-8 lg:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-1.5 pb-3 pt-4 lg:pt-0">
            <p className="text-lg font-bold leading-7 text-[#101828]">{fund.symbol}</p>
            <p className="text-sm leading-5 text-[#4a5565]">{fund.name}</p>
          </div>

          <div className="flex flex-col gap-2.5 pb-3">
            <div className="flex items-end gap-1">
              <Image src={MF_ASSETS.navPriceIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
              <span className="text-[32px] font-bold leading-[48px] text-[#101828]">{fund.nav}</span>
              <span className="text-sm leading-5 text-[#6a7282]">{fund.currency}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs leading-4 ${
                  isPositive ? "bg-[#dbfce7] text-[#008236]" : "bg-[#fee2e2] text-[#fb2c36]"
                }`}
              >
                {fund.changePct}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] leading-[14px] text-[#666]">
                <ClockIcon size={16} />
                {fund.navDate}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <RiskTag risk={fund.risk} />
              <FxRiskTag label={fund.fxRisk} />
              {fund.acceptsCreditCard && <CreditCardTag />}
            </div>
          </div>

          <div
            className="sticky top-12 z-20 flex w-full overflow-x-auto border-b border-black/10 bg-white md:overflow-visible lg:top-0 lg:bg-white"
            style={{ scrollbarWidth: "none" }}
          >
            {DETAIL_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap md:min-w-[80px] md:flex-1 md:shrink lg:min-w-[80px] lg:flex-1 ${
                    active
                      ? "border-[#0a6ee7] text-[#0a6ee7]"
                      : "border-black/10 text-black/60"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <DetailBody fund={fund} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
