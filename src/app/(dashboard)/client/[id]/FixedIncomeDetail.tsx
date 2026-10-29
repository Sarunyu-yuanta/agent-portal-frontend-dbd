"use client";

import { useEffect } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, CaretDoubleRightIcon, FileTextIcon } from "@phosphor-icons/react";
import { BOND_LOGOS, type FixedIncomeBond } from "./fixed-income-data";
import { BORDER_COLOR, ACTION_LABELS, StatusTag, BondLogo } from "./fixed-income-shared";
import { fixedIncomeToBookableProduct } from "./fixed-income-data";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { QuotaBookButton, useQuotaBooking } from "@/app/(dashboard)/orders/useQuotaBooking";

function DetailTable({ bond }: { bond: FixedIncomeBond }) {
  const rows: {
    label: string;
    value?: string;
    link?: boolean;
    documents?: { label: string; href?: string }[];
  }[] = [
    { label: "อัตราผลตอบแทน (YTM)", value: bond.ytm },
    { label: "อัตราดอกเบี้ย (Coupon)", value: bond.couponRate },
    { label: "งวดดอกเบี้ย", value: bond.couponPeriod },
    { label: "อายุ", value: bond.tenor },
    { label: "วันครบกำหนด", value: bond.maturity },
    { label: "Ratings บริษัท", value: bond.companyRating },
    { label: "Ratings หุ้นกู้", value: bond.bondRating },
    { label: "ความเสี่ยง", value: bond.risk },
    { label: "การค้ำประกัน", value: bond.guarantee, link: true },
    { label: "ประเภทเสนอขาย", value: bond.offerType },
    { label: "เปิดจองวันที่", value: bond.subscriptionPeriod },
    { label: "เอกสารที่เกี่ยวข้อง", documents: bond.documents },
  ];

  return (
    <div
      className="flex flex-col w-full rounded-md overflow-hidden"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex gap-3 items-start px-4 py-2 w-full text-base leading-5 ${
            i % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"
          }`}
        >
          <span className="flex-1 min-w-0 text-[#4a5565]">{row.label}</span>
          {row.documents ? (
            <div className="flex flex-1 min-w-0 flex-col gap-4 items-start">
              {row.documents.map((doc) => (
                <button
                  key={doc.label}
                  type="button"
                  className="inline-flex items-center gap-0.5 text-[#2b7fff] underline border-none bg-transparent p-0 cursor-pointer text-base leading-5"
                >
                  {doc.label}
                  <FileTextIcon size={14} className="shrink-0" />
                </button>
              ))}
            </div>
          ) : row.link ? (
            <button
              type="button"
              className="flex-1 min-w-0 text-left text-[#0a6ee7] underline border-none bg-transparent p-0 cursor-pointer text-base leading-5"
            >
              {row.value}
            </button>
          ) : (
            <span className="flex-1 min-w-0 text-[#101828]">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function FixedIncomeDetail({
  bond,
  onBack,
  onCompanySelect,
}: {
  bond: FixedIncomeBond;
  onBack: () => void;
  onCompanySelect?: (companyId: string) => void;
}) {
  const isFollowed = bond.action === "followed";
  const booking = useQuotaBooking();

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [bond.id]);

  return (
    <div
      className="flex flex-col items-center w-full pt-6 pb-20 px-4 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[998px]">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[26px] text-[#101828] truncate">
          Fixed Income
        </h1>
      </div>

      <div
        className="flex flex-col gap-14 items-center w-full max-w-[998px] px-6 py-8 md:px-10 lg:px-14 rounded-xl bg-white"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        <div className="flex flex-col gap-6 w-full">
          <button
            type="button"
            onClick={() => onCompanySelect?.(bond.companyName)}
            className="flex gap-1 items-center w-full pb-2 border-b border-black/10 border-solid border-t-0 border-x-0 bg-transparent p-0 cursor-pointer text-left"
          >
            <span className="flex-1 min-w-0 text-base leading-5 text-[#4a5565] truncate">
              {bond.fullCompanyName}
            </span>
            <CaretDoubleRightIcon size={20} className="shrink-0 text-[#101828]" />
          </button>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-3 items-center w-full">
              <BondLogo src={BOND_LOGOS[bond.logoIdx]} logoCrop={bond.logoCrop} className="size-12 rounded-md" />
              <div className="flex flex-1 min-w-0 flex-col gap-1">
                <p className="text-lg font-bold leading-6 text-[#101828] truncate w-full">{bond.symbol}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusTag status={bond.status} label={bond.statusLabel} />
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-[#f3f4f6] text-xs leading-4 text-[#4a5565] whitespace-nowrap">
                    {bond.bondCategory}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <p className="text-lg font-bold leading-6 text-[#008236] whitespace-nowrap">{bond.ytm}</p>
                <p className="text-sm leading-5 text-[#4a5565]">YTM</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 items-center w-full">
              <DetailTable bond={bond} />
              <p className="text-sm leading-5 text-[#6a7282] text-center whitespace-nowrap">
                อัปเดตล่าสุด {bond.updatedAt}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center w-full">
          {/* Open for subscription: book a client straight in (see
              `useQuotaBooking`). Otherwise the follow action, as before. */}
          {ORDER_BOOKING_ENABLED && bond.action === "invest" ? (
            <QuotaBookButton
              product={fixedIncomeToBookableProduct(bond)}
              onBook={booking.book}
              size="xl"
              className="w-full max-w-[343px]"
              label={ACTION_LABELS[bond.action]}
            />
          ) : (
            <Button
              variant="primary"
              size="xl"
              disabled={isFollowed}
              className="w-full max-w-[343px]"
            >
              {ACTION_LABELS[bond.action]}
            </Button>
          )}
        </div>
        {booking.ui}
      </div>
    </div>
  );
}
