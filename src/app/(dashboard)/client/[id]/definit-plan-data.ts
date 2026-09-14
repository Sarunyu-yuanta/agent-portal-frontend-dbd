import type { RoboRiskTier } from "./robo-risk-level";

/** Figma 34315:85739 / 34315:85740 — Definit x Yuanta plan cards. */
export type DefinitPlan = {
  id: string;
  name: string;
  intro: string;
  factors: string[];
  riskTier: RoboRiskTier;
  availableRoom: string;
  minInvestment: string;
  holdingPeriod: string;
  maxDrawdown: string;
};

export const DEFINIT_PLANS: DefinitPlan[] = [
  {
    id: "dss",
    name: "Definit Set Select (DSS)",
    intro: "คัดเลือกหุ้นไทยอย่างเป็นระบบด้วย 3 ปัจจัยสำคัญ ได้แก่",
    factors: [
      "Earnings การปรับเพิ่มคาดการณ์กำไรของนักวิเคราะห์",
      "Valuation P/E ไม่แพงเมื่อเทียบกับ อุตสาหกรรม",
      "Technical ราคาหุ้นมี โมเมนตัมเชิงบวกระยะสั้น",
    ],
    riskTier: "high",
    availableRoom: "400/2000",
    minInvestment: "500,000",
    holdingPeriod: "3 - 5 ปี",
    maxDrawdown: "-33.20%",
  },
  {
    id: "dgs",
    name: "Definit Global Select (DGS)",
    intro: "คัดเลือก DR อย่างเป็นระบบด้วย 2 ปัจจัยสำคัญ ได้แก่",
    factors: [
      "Earnings การปรับเพิ่มคาดการณ์กำไรของนักวิเคราะห์",
      "Momentum ราคาหุ้นมีโมเมนตัมเชิงบวกระยะกลาง",
    ],
    riskTier: "high",
    availableRoom: "700/2000",
    minInvestment: "500,000",
    holdingPeriod: "3 - 5 ปี",
    maxDrawdown: "-37.88%",
  },
];
