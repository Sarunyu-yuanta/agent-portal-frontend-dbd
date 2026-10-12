"use client";

import Link from "next/link";
import { Card } from "@sarunyu/system-one";
import type { CardTagStatus } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { campaignDateLine, FORMAT_LABEL, PRODUCT_LABEL } from "./campaign-data";

/**
 * One campaign in the grid: the design system's `Card variant="event"`, and
 * nothing else.
 *
 * Everything rendered here comes out of that card — the banner, the title, the
 * orange calendar row, the venue line, the audience line, the status chip. The
 * only thing wrapped around it is a `<Link>`, which draws nothing and exists so
 * the card has somewhere to go.
 *
 * All this file does, then, is map a `Campaign` onto that card's props. Where
 * the two disagree is written down below, because the card is built for events
 * and half of these are promotions.
 */
export function CampaignCard({
  campaign,
  seatsLeft,
}: {
  campaign: Campaign;
  /** Events only; `null` for a promotion, which has no seats. */
  seatsLeft: number | null;
}) {
  const isEvent = campaign.type === "event";

  /**
   * The audience row, as that row wants it — taken, out of the total.
   * `undefined` switches the row off: a promotion has no attendees, and the
   * label it would print ("ผู้เข้าร่วม") is fixed by the design system.
   */
  const attendance =
    isEvent && campaign.seatsTotal !== undefined && seatsLeft !== null
      ? `${campaign.seatsTotal - seatsLeft}/${campaign.seatsTotal}`
      : undefined;

  /**
   * The chip. "เต็มแล้ว" once the seats are gone, otherwise the default.
   *
   * It always renders and its three labels are all about registration, so a
   * promotion gets "ยังไม่ลงทะเบียน" — which it has nothing to register for.
   * That is the card's wording, not a choice made here.
   */
  const tagStatus: CardTagStatus = seatsLeft === 0 ? "full" : "not-registered";

  /** The second fact on the date row, so its divider isn't left orphaned. */
  const secondary = isEvent
    ? campaign.format
      ? FORMAT_LABEL[campaign.format]
      : ""
    : campaign.products.map((p) => PRODUCT_LABEL[p]).join(" · ");

  return (
    <Link href={`/promotions/${campaign.id}`} className="no-underline">
      <Card
        variant="event"
        // `locked` defaults to *true* and stamps a padlock over the banner.
        locked={false}
        image={campaign.cover}
        title={campaign.title}
        date={campaignDateLine(campaign)}
        time={secondary}
        location={campaign.venue ?? ""}
        showLocation={isEvent && Boolean(campaign.venue)}
        showAudience={attendance !== undefined}
        count={attendance}
        tagStatus={tagStatus}
      />
    </Link>
  );
}
