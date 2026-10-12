"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  ChatTextIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FilePdfIcon,
  HourglassMediumIcon,
  ImageIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { Button, Tag } from "@sarunyu/system-one";
import type { CampaignMaterial, CampaignMaterialType } from "@/types/domain";

/**
 * The artwork and copy an IC is allowed to send.
 *
 * Approval is the whole point of this card, so an unapproved material is shown
 * rather than hidden: an IC who cannot find the deck assumes it does not exist
 * and writes their own, which is the outcome compliance is trying to prevent.
 * It renders greyed, with the version and the reason it is still out, and none
 * of its actions. The store refuses it too — see `shareMaterial` in
 * `contexts/campaigns-context` — because a disabled button is a courtesy, not a
 * control.
 *
 * Selecting a material is how the eligible-clients table below knows what a
 * bulk "แชร์" would send; that is why the selection lives on the page rather
 * than in here.
 */

const MATERIAL_ICON: Record<CampaignMaterialType, React.ElementType> = {
  "line-image": ImageIcon,
  pdf: FilePdfIcon,
  script: ChatTextIcon,
};

const MATERIAL_KIND: Record<CampaignMaterialType, string> = {
  "line-image": "รูปภาพ",
  pdf: "PDF",
  script: "สคริปต์",
};

export function MaterialsCard({
  materials,
  selectedId,
  closed,
  onSelect,
  onShareOne,
  onCopied,
}: {
  materials: CampaignMaterial[];
  /** The approved material a bulk share would send. */
  selectedId: string | null;
  /**
   * The campaign has closed, so nothing can be sent.
   *
   * Only sharing goes: copy and download stay, because an IC looking at a
   * finished campaign is usually looking for what they sent, and taking the
   * record away with the offer would be the wrong half to remove.
   */
  closed: boolean;
  onSelect: (id: string) => void;
  /** Opens the share flow for this one material. */
  onShareOne: (id: string) => void;
  /** Reports a successful copy, so the page can toast it. */
  onCopied: (label: string) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="type-subtitle-1 font-bold text-foreground">
          สื่อที่อนุมัติแล้ว
        </h2>
        <p className="text-[12.5px] text-muted-foreground">
          {closed
            ? "แคมเปญนี้หมดเขตแล้ว ส่งสื่อให้ลูกค้าเพิ่มไม่ได้ แต่ยังเปิดดูและดาวน์โหลดได้"
            : "ส่งให้ลูกค้าได้เฉพาะสื่อที่ Compliance อนุมัติแล้วเท่านั้น และทุกครั้งที่ส่งจะถูกบันทึกไว้"}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {materials.map((material) => (
          <MaterialRow
            key={material.id}
            material={material}
            selected={material.id === selectedId}
            closed={closed}
            onSelect={() => onSelect(material.id)}
            onShare={() => onShareOne(material.id)}
            onCopied={onCopied}
          />
        ))}
      </div>
    </section>
  );
}

function MaterialRow({
  material,
  selected,
  closed,
  onSelect,
  onShare,
  onCopied,
}: {
  material: CampaignMaterial;
  selected: boolean;
  closed: boolean;
  onSelect: () => void;
  onShare: () => void;
  onCopied: (label: string) => void;
}) {
  const Icon = MATERIAL_ICON[material.type];
  const [scriptOpen, setScriptOpen] = useState(false);
  const blocked = !material.approved;

  const copy = async () => {
    // A script *is* its text; everything else is a file, and what is useful on
    // the clipboard is the link to it.
    const value =
      material.type === "script"
        ? material.url
        : `${window.location.origin}${material.url}`;
    try {
      await navigator.clipboard.writeText(value);
      onCopied(material.label);
    } catch {
      // Clipboard access can be refused (insecure context, denied permission).
      // Nothing is broken — the material is still on screen to copy by hand.
    }
  };

  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        blocked
          ? "border-border bg-[var(--fill-gray-50,#fafafa)]"
          : selected
            ? "border-primary-action bg-primary-action-light"
            : "border-border bg-card hover:border-primary-action/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
            blocked
              ? "bg-[var(--fill-gray-100)] text-[var(--fill-gray-400)]"
              : "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]"
          }`}
        >
          <Icon size={18} weight="fill" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-[13.5px] font-semibold leading-snug ${
                blocked ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {material.label}
            </p>
            {material.approved ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--success-bg,#ecfdf5)] px-1.5 py-0.5 text-[11.5px] font-semibold text-[var(--success,#059669)]">
                <CheckCircleIcon size={13} weight="fill" />
                อนุมัติแล้ว
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--fill-gray-100)] px-1.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                <HourglassMediumIcon size={13} weight="fill" />
                รออนุมัติ
              </span>
            )}
            <Tag text={MATERIAL_KIND[material.type]} variant="gray" size="small" />
            <span className="text-[11.5px] font-medium tabular-nums text-muted-foreground">
              {material.version}
            </span>
          </div>

          {blocked && material.pendingReason && (
            <p className="text-[12px] leading-snug text-muted-foreground">
              {material.pendingReason}
            </p>
          )}

          {material.type === "script" && !blocked && (
            <>
              <button
                type="button"
                onClick={() => setScriptOpen((v) => !v)}
                className="w-fit cursor-pointer text-[12.5px] font-medium text-primary-action hover:underline"
              >
                {scriptOpen ? "ซ่อนสคริปต์" : "ดูสคริปต์"}
              </button>
              {scriptOpen && (
                <p className="rounded-lg bg-muted/50 p-3 text-[13px] leading-relaxed text-foreground">
                  {material.url}
                </p>
              )}
            </>
          )}

          {!blocked && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {!closed && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PaperPlaneTiltIcon size={14} weight="fill" />}
                  onClick={onShare}
                >
                  แชร์ให้ลูกค้า
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CopyIcon size={14} />}
                onClick={copy}
              >
                {material.type === "script" ? "คัดลอกสคริปต์" : "คัดลอกลิงก์"}
              </Button>
              {material.type !== "script" && (
                <Button
                  variant="plain"
                  size="sm"
                  leftIcon={<DownloadSimpleIcon size={14} />}
                  onClick={() => window.open(material.url, "_blank", "noopener")}
                >
                  ดาวน์โหลด
                </Button>
              )}
              {!closed &&
                (selected ? (
                  <span className="text-[12.5px] font-medium text-primary-action">
                    เลือกไว้สำหรับส่งหลายคน
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onSelect}
                    className="cursor-pointer text-[12.5px] font-medium text-primary-action hover:underline"
                  >
                    เลือกสำหรับส่งหลายคน
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
