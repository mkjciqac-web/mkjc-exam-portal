import { useActor } from "@caffeineai/core-infrastructure";
import { useEffect, useRef, useState } from "react";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";

interface HomePageProps {
  startExam: (regId: bigint, testKey: string) => void;
  setPage: (p: Page) => void;
  lang: Lang;
  setLang?: (l: Lang) => void;
}

// ── Data constants ─────────────────────────────────────────────────────────
const PROGRAMMES: Record<string, string[]> = {
  Science: [
    "B.Sc Mathematics",
    "B.Sc Statistics",
    "B.Sc Physics",
    "B.Sc Chemistry",
    "B.Sc Biochemistry",
    "B.Sc Biotechnology",
    "B.Sc Microbiology",
    "B.Sc Nutrition, FSM & Dietetics",
    "B.Sc Psychology",
    "B.Sc Interior Design & Decor",
    "B.Sc Costume Design & Fashion Technology",
    "B.Sc Computer Science",
    "B.C.A",
    "B.Sc Artificial Intelligence",
    "B.Sc Data Science",
  ],
  Arts: ["B.A English", "B.A Tamil", "B.A Economics"],
  Management: ["B.B.A"],
  Commerce: [
    "B.Com",
    "B.Com (Computer Applications)",
    "B.Com (Professional Accounting)",
  ],
};

const DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kancheepuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

const GROUPS = [
  {
    value: "Group I",
    label:
      "Group I (Science): Physics, Chemistry, Mathematics, Computer Science/Biology",
  },
  {
    value: "Group II",
    label: "Group II (Bio-Maths): Mathematics, Physics, Chemistry, Biology",
  },
  {
    value: "Group III",
    label: "Group III: Physics, Chemistry, Botany, Zoology",
  },
  {
    value: "Group IV",
    label: "Group IV (Commerce): Commerce, Accountancy, Economics",
  },
];

const WHY_ITEMS = [
  { main: "32 Years of Educational Excellence", sub: "" },
  { main: "No.1 Women's Institution", sub: "" },
  { main: "NAAC A+ Accreditation", sub: "" },
  { main: "Autonomous Institution", sub: "" },
  { main: "Best College Award", sub: "from Thiruvalluvar University" },
  { main: "IIC 4 Star Rated", sub: "" },
  { main: "100% Placements", sub: "Top companies campus placement" },
  { main: "Excellent Infrastructure", sub: "" },
  { main: "Industry Aligned Curriculum", sub: "" },
  { main: "Sports Facilities", sub: "Indoor & outdoor sports infrastructure" },
  { main: "Digital Library", sub: "DELNET INFLIBNET e-resources" },
  { main: "NCC / NSS", sub: "Leadership & community service" },
  { main: "Hygienic Hostel", sub: "Secure women's hostel" },
  { main: "Bus Facility", sub: "51 College buses" },
  { main: "Scholarships", sub: "Government & Institutional aid available" },
];

const SYL_GROUPS = [
  {
    name: "Group I",
    tooltip:
      "Pattern 1: English - 14 | Physics - 12 | Chemistry - 12 | Mathematics - 12",
  },
  {
    name: "Group II",
    tooltip:
      "Pattern 2: English - 14 | Physics - 12 | Chemistry - 12 | Biology - 12 [Botany - 6, Zoology - 6]",
  },
  {
    name: "Group IV",
    tooltip:
      "Pattern 3: English - 14 | Commerce - 12 | Accountancy - 12 | Economics - 12 | General Knowledge - 6",
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ── Types ──────────────────────────────────────────────────────────────────
interface FormData {
  fullName: string;
  dob: string;
  aadhaar: string;
  email: string;
  mobile: string;
  whatsapp: string;
  fatherName: string;
  parentMobile: string;
  motherName: string;
  school12: string;
  district: string;
  group12: string;
  choice1: string;
  choice2: string;
  choice3: string;
}
interface FormErrors {
  [key: string]: string;
}

// ── Inject global styles once ──────────────────────────────────────────────
const STYLES = `
.mkjc-body { font-family: 'Segoe UI', Arial, sans-serif; background: #0d1b3e; color: #fff; min-height: 100vh; overflow-x: auto; }
.mkjc-header { text-align: center; padding: 26px 16px 16px; background: #0d1b3e; position: relative; }
.mkjc-header h1 { font-size: 1.44rem; font-weight: 900; letter-spacing: 2px; color: #f5c518; text-transform: uppercase; line-height: 1.3; margin: 0; }
.mkjc-header-btns { position: absolute; top: 12px; right: 16px; display: flex; gap: 8px; align-items: center; }
.mkjc-header-admin-btn { background: #fff; color: #1a3acc; border: 1.5px solid #1a3acc; border-radius: 6px; padding: 6px 14px; font-size: 0.78rem; font-weight: 700; cursor: pointer; letter-spacing: 0.3px; transition: background .2s, color .2s; }
.mkjc-header-admin-btn:hover { background: #e8edff; }
.mkjc-header-student-btn { background: #1a3acc; color: #fff; border: 1.5px solid #1a3acc; border-radius: 6px; padding: 6px 14px; font-size: 0.78rem; font-weight: 700; cursor: pointer; letter-spacing: 0.3px; transition: background .2s; }
.mkjc-header-student-btn:hover { background: #1430aa; }
.mkjc-national { font-size: 0.7rem; letter-spacing: 4px; color: #f5c518; margin: 4px 0 6px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.mkjc-national::before, .mkjc-national::after { content: ''; display: inline-block; width: 58px; height: 1px; background: #f5c518; }
.mkjc-accred { color: #c8a84b; font-size: 0.72rem; margin: 2px 0; letter-spacing: 0.01em; font-style: italic; }
.mkjc-header h2 { font-size: 1.5rem; font-weight: 700; color: #fff; letter-spacing: 1px; margin: 6px 0 0; }
.mkjc-header p { font-size: 0.82rem; color: #7eb3f5; margin-top: 4px; }
.mkjc-gold { color: #f5c518; font-weight: 800; text-transform: uppercase; }
.mkjc-grid { display: grid; grid-template-columns: 232px 1fr 242px; gap: 16px; max-width: 1152px; margin: 0 auto; padding: 0 12px 28px; min-width: 840px; }
.mkjc-panel { background: #0d1b3e; border-radius: 8px; padding: 0 13px 16px; margin-bottom: 14px; border: 1.5px solid #1e2e5a; overflow: hidden; }
.mkjc-panel-title { background: #f5c518; color: #0d1b3e; font-weight: 800; font-size: 0.85rem; letter-spacing: 2px; text-align: center; padding: 9px 10px; margin: 0 -13px 13px -13px; text-transform: uppercase; }
.mkjc-prog-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin-bottom: 12px; text-align: center; }
.mkjc-prog-stat-box { background: #1a2750; border-radius: 5px; padding: 6px 4px; }
.mkjc-prog-stat-num { font-size: 1.2rem; font-weight: 900; color: #f5c518; line-height: 1; }
.mkjc-prog-stat-label { font-size: 0.68rem; color: #fff; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
.mkjc-prog-cat { font-size: 0.82rem; font-weight: 800; letter-spacing: 1.5px; color: #f5c518; text-transform: uppercase; margin: 10px 0 5px; }
.mkjc-prog-list { list-style: none; padding: 0; margin: 0; }
.mkjc-prog-list li { font-size: 0.85rem; color: #d4e4ff; padding: 1px 0; line-height: 1.4; }
.mkjc-prog-list li::before { content: '> '; color: #f5c518; font-weight: 700; }
.mkjc-why-list { list-style: none; padding: 0; margin: 0; }
.mkjc-why-item { padding: 5px 0; border-bottom: 1px solid #1e2e5a; }
.mkjc-why-item:last-child { border-bottom: none; }
.mkjc-why-main { font-size: 0.88rem; font-weight: 700; color: #fff; display: flex; align-items: flex-start; gap: 5px; }
.mkjc-why-main::before { content: '•'; color: #f5c518; flex-shrink: 0; font-size: 1rem; margin-top: 0; }
.mkjc-why-sub { font-size: 0.76rem; color: #d4e4ff; padding-left: 15px; margin-top: 1px; }
.mkjc-exam-card { background: #0d1b3e; border: 1.5px solid #1e2e5a; border-radius: 7px; overflow: hidden; }
.mkjc-exam-title { font-size: 0.85rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0d1b3e; background: #f5c518; text-align: center; margin: 0; padding: 8px 14px; }
.mkjc-exam-list { padding: 0 14px; margin: 12px 0 14px; list-style: none; }
.mkjc-exam-list li { font-size: 0.82rem; color: #d4e4ff; padding: 5px 0; border-bottom: 1px solid #1e2e5a; line-height: 1.5; }
.mkjc-exam-list li:last-child { border-bottom: none; }
.mkjc-exam-label { font-weight: 700; color: #f5c518; }
.mkjc-prohibited { color: #ff8a8a !important; }
.mkjc-prohibited .mkjc-exam-label { color: #ff5c5c; }
.mkjc-form-card { background: #1a2d6b; border-radius: 12px; overflow: hidden; }
.mkjc-form-header { background: #1a3acc; padding: 11px; text-align: center; font-size: 1.1rem; font-weight: 800; letter-spacing: 2.5px; display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase; color: #fff; }
.mkjc-form-body { padding: 16px 16px 0; }
.mkjc-section-heading { font-size: 0.74rem; font-weight: 800; letter-spacing: 1.2px; color: #f5c518; text-transform: uppercase; margin: 17px 0 10px; display: flex; align-items: center; gap: 8px; }
.mkjc-section-heading::after { content: ''; flex: 1; height: 1px; background: #2a3e7a; }
.mkjc-form-group { margin-bottom: 12px; }
.mkjc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mkjc-field-label { font-size: 0.7rem; color: #d4e4ff; display: block; margin-bottom: 4px; }
.mkjc-req { color: #e03030; }
.mkjc-field-hint { font-size: 0.6rem; color: #7eb3f5; margin-top: 1px; }
.mkjc-field-wrap { position: relative; }
.mkjc-field-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #6a82b5; font-size: 0.82rem; pointer-events: none; }
.mkjc-input { width: 100%; background: #fff; color: #222; border: 1.8px solid #3a5ab5; border-radius: 6px; padding: 8px 10px 8px 32px; font-size: 0.82rem; outline: none; transition: border-color .2s; font-family: inherit; box-sizing: border-box; }
.mkjc-input:focus { border-color: #f5c518; }
.mkjc-input-no-icon { padding-left: 10px !important; }
.mkjc-select { width: 100%; background: #fff; color: #222; border: 1.8px solid #3a5ab5; border-radius: 6px; padding: 8px 10px; font-size: 0.82rem; outline: none; transition: border-color .2s; font-family: inherit; box-sizing: border-box; cursor: pointer; }
.mkjc-select:focus { border-color: #f5c518; }
.mkjc-field-err { font-size: 0.62rem; color: #e03030; margin-top: 2px; }
.mkjc-divider { border: none; border-top: 1px solid #2a3e7a; margin: 12px 0; }
.mkjc-submit-btn { width: 100%; background: #1a3acc; color: #fff; border: none; border-radius: 7px; padding: 13px; font-size: 0.96rem; font-weight: 800; letter-spacing: 2px; cursor: pointer; text-transform: uppercase; transition: background .2s; margin: 16px 0; display: block; }
.mkjc-submit-btn:hover { background: #1430aa; }
.mkjc-submit-btn:disabled { background: #3a5ab5; cursor: not-allowed; opacity: 0.7; }
.mkjc-dob-wrap { display: flex; gap: 6px; align-items: center; position: relative; }
.mkjc-dob-wrap .mkjc-input { flex: 1; }
.mkjc-cal-btn { background: #1a3acc; border: none; border-radius: 6px; padding: 0 10px; height: 36px; cursor: pointer; color: #fff; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .2s; }
.mkjc-cal-btn:hover { background: #f5c518; color: #0d1b3e; }
.mkjc-cal-popup { position: fixed; background: #fff; border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 5000; width: 280px; overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; }
.mkjc-cal-head { background: #1a3acc; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; }
.mkjc-cal-head button { background: none; border: none; color: #fff; font-size: 1.1rem; cursor: pointer; padding: 2px 7px; border-radius: 4px; transition: background .15s; }
.mkjc-cal-head button:hover { background: rgba(255,255,255,0.2); }
.mkjc-cal-my { font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background .15s; background: none; border: none; color: #fff; }
.mkjc-cal-my:hover { background: rgba(255,255,255,0.15); }
.mkjc-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); padding: 8px 10px 10px; gap: 2px; }
.mkjc-cal-dow { text-align: center; font-size: 0.65rem; font-weight: 700; color: #6a82b5; padding: 4px 0; text-transform: uppercase; }
.mkjc-cal-day { text-align: center; padding: 6px 0; border-radius: 50%; font-size: 0.8rem; color: #222; cursor: pointer; transition: background .15s, color .15s; user-select: none; background: none; border: none; width: 100%; }
.mkjc-cal-day:hover { background: #dde7ff; }
.mkjc-cal-day.today { border: 2px solid #1a3acc; font-weight: 700; }
.mkjc-cal-day.selected { background: #1a3acc; color: #fff; font-weight: 700; }
.mkjc-ym-picker { padding: 10px; max-height: 220px; overflow-y: auto; }
.mkjc-ym-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin-top: 6px; }
.mkjc-ym-item { text-align: center; padding: 6px 4px; border-radius: 6px; font-size: 0.78rem; cursor: pointer; color: #222; transition: background .15s; background: none; border: none; width: 100%; }
.mkjc-ym-item:hover { background: #dde7ff; }
.mkjc-ym-item.selected { background: #1a3acc; color: #fff; font-weight: 700; }
.mkjc-ym-label { font-size: 0.7rem; font-weight: 700; color: #6a82b5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.mkjc-toast { position: fixed; top: 22px; right: 22px; padding: 13px 22px; border-radius: 8px; font-weight: 700; font-size: 0.87rem; z-index: 9999; opacity: 0; transform: translateY(-18px); transition: opacity .3s, transform .3s; pointer-events: none; max-width: 320px; color: #fff; }
.mkjc-toast.show { opacity: 1; transform: translateY(0); }
.mkjc-toast.success { background: #0fa88a; }
.mkjc-toast.error { background: #e03030; }
.mkjc-admin-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.72); z-index: 8000; display: flex; align-items: center; justify-content: center; border: none; padding: 0; max-width: 100vw; max-height: 100vh; width: 100vw; height: 100vh; }
.mkjc-admin-modal { background: #10203e; border: 2px solid #f5c518; border-radius: 12px; padding: 28px 26px 22px; width: 420px; max-width: 96vw; }
.mkjc-admin-modal h3 { color: #f5c518; margin: 0 0 14px; font-size: 1rem; letter-spacing: 1.5px; }
.mkjc-admin-label { font-size: 0.75rem; color: #d4e4ff; display: block; margin-bottom: 4px; margin-top: 12px; }
.mkjc-admin-input { width: 100%; background: #fff; color: #222; border: 1.5px solid #3a5ab5; border-radius: 6px; padding: 8px 10px; font-size: 0.82rem; box-sizing: border-box; }
.mkjc-code-block { background: #0a1525; border: 1px solid #2a3e7a; border-radius: 6px; padding: 12px; font-family: 'Courier New', monospace; font-size: 0.62rem; color: #a8d0ff; overflow-x: auto; max-height: 220px; overflow-y: auto; margin-top: 10px; white-space: pre; }
.mkjc-admin-note { font-size: 0.68rem; color: #7eb3f5; margin-top: 14px; line-height: 1.6; }
.mkjc-copy-btn { background: #2a3e7a; color: #fff; border: none; border-radius: 5px; padding: 5px 12px; font-size: 0.72rem; cursor: pointer; margin-top: 8px; transition: background .2s; }
.mkjc-copy-btn:hover { background: #f5c518; color: #0d1b3e; }
.mkjc-copy-btn.copied { background: #0fa88a; }
.mkjc-admin-btns { display: flex; gap: 10px; margin-top: 18px; }
.mkjc-admin-btns button { flex: 1; padding: 9px; border-radius: 6px; border: none; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
.mkjc-btn-save { background: #f5c518; color: #0d1b3e; }
.mkjc-btn-cancel { background: #2a3e7a; color: #fff; }
.mkjc-success-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9000; display: flex; align-items: center; justify-content: center; animation: mkjcFadeIn .3s ease; border: none; padding: 0; max-width: 100vw; max-height: 100vh; width: 100vw; height: 100vh; }
@keyframes mkjcFadeIn { from { opacity: 0; } to { opacity: 1; } }
.mkjc-success-modal { background: #1a2d6b; border: 3px solid #0fa88a; border-radius: 14px; padding: 36px 32px; width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; box-shadow: 0 12px 48px rgba(0,0,0,0.5); animation: mkjcSlideUp .3s ease; }
@keyframes mkjcSlideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.mkjc-success-header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #0fa88a; padding-bottom: 16px; }
.mkjc-check-icon { font-size: 3.5rem; color: #0fa88a; margin-bottom: 12px; display: block; animation: mkjcBounce .6s ease; }
@keyframes mkjcBounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.mkjc-success-header h2 { color: #0fa88a; font-size: 1.6rem; margin: 0; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
.mkjc-success-header p { color: #7eb3f5; font-size: 0.9rem; margin-top: 6px; }
.mkjc-success-details { background: #0d1b3e; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
.mkjc-detail-section { margin-bottom: 18px; }
.mkjc-detail-section:last-child { margin-bottom: 0; }
.mkjc-detail-title { color: #f5c518; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.mkjc-detail-title::before { content: 'check'; font-family: 'Material Icons', serif; color: #0fa88a; speak: none; }
.mkjc-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mkjc-detail-item { background: #1a2750; padding: 12px; border-radius: 6px; }
.mkjc-detail-item.full { grid-column: 1 / -1; }
.mkjc-detail-label { color: #7eb3f5; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
.mkjc-detail-value { color: #fff; font-size: 0.9rem; font-weight: 600; word-break: break-word; }
.mkjc-success-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mkjc-success-actions button { padding: 14px; border: none; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; letter-spacing: 1px; text-transform: uppercase; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.mkjc-btn-download { background: #0fa88a; color: #0d1b3e; }
.mkjc-btn-download:hover { background: #0d9e7f; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,168,138,0.4); }
.mkjc-btn-new { background: #3a5ab5; color: #fff; }
.mkjc-btn-new:hover { background: #2a45a0; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(58,90,181,0.4); }
.mkjc-footer { background: #5a0000; color: #fff; text-align: center; padding: 12px 16px; font-size: 0.72rem; }

.mkjc-syl-group { display: inline-block; color: #f5d77a; font-weight: 700; cursor: pointer; border-bottom: 1px dashed #c8a84b; position: relative; background: none; border-left: none; border-right: none; border-top: none; padding: 0; font-size: inherit; font-family: inherit; }
.mkjc-syl-tooltip { position: fixed; background: #f5d77a; border: 1px solid #0d1b3e; border-radius: 8px; padding: 10px 34px 10px 14px; font-size: 0.85rem; color: #0d1b3e; font-weight: 600; white-space: nowrap; z-index: 1000; box-shadow: 0 4px 18px rgba(0,0,0,0.5); animation: mkjcFadeIn .2s ease; top: 50%; left: 50%; transform: translate(-50%,-50%); min-width: 280px; }
.mkjc-syl-close { position: absolute; top: 5px; right: 9px; background: none; border: none; color: #0d1b3e; font-size: 1.1rem; font-weight: 900; line-height: 1; cursor: pointer; padding: 0; opacity: 0.6; }
.mkjc-syl-close:hover { opacity: 1; }
`;

// ── Component ──────────────────────────────────────────────────────────────
export default function HomePage({
  startExam: _startExam,
  setPage,
}: HomePageProps) {
  const { actor, isFetching: actorLoading } = useActor(createActor);
  // Inject styles once
  useEffect(() => {
    const id = "mkjc-styles";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }, []);

  // ── Form state ──────────────────────────────────────────────────────
  const emptyForm: FormData = {
    fullName: "",
    dob: "",
    aadhaar: "",
    email: "",
    mobile: "",
    whatsapp: "",
    fatherName: "",
    parentMobile: "",
    motherName: "",
    school12: "",
    district: "",
    group12: "",
    choice1: "",
    choice2: "",
    choice3: "",
  };
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<FormData | null>(null);
  const [studentCredentials, setStudentCredentials] = useState<{
    user_id: string;
    password: string;
  } | null>(null);

  // ── Toast ────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  // ── Calendar state ────────────────────────────────────────────────────
  const calBtnRef = useRef<HTMLButtonElement>(null);
  const calPopupRef = useRef<HTMLDivElement>(null);
  const [calIsOpen, setCalIsOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear() - 17);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calSelY, setCalSelY] = useState<number | null>(null);
  const [calSelM, setCalSelM] = useState<number | null>(null);
  const [calSelD, setCalSelD] = useState<number | null>(null);
  const [calYmMode, setCalYmMode] = useState(false);
  const [calPos, setCalPos] = useState({ top: 0, left: 0 });

  function openCal() {
    const val = form.dob.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/").map(Number);
      setCalSelD(d);
      setCalSelM(m - 1);
      setCalSelY(y);
      setCalYear(y);
      setCalMonth(m - 1);
    }
    if (calBtnRef.current) {
      const rect = calBtnRef.current.getBoundingClientRect();
      // position: fixed uses viewport coords — do NOT add scrollX/scrollY
      setCalPos({
        top: rect.bottom + 6,
        left: Math.max(0, Math.min(rect.right - 280, window.innerWidth - 292)),
      });
    }
    setCalYmMode(false);
    setCalIsOpen(true);
  }

  useEffect(() => {
    if (!calIsOpen) return;
    function handler(e: MouseEvent) {
      if (
        calPopupRef.current &&
        !calPopupRef.current.contains(e.target as Node) &&
        !calBtnRef.current?.contains(e.target as Node)
      ) {
        setCalIsOpen(false);
      }
    }
    // Use a timeout so this listener is attached AFTER the current click event
    // that opened the calendar has fully propagated — prevents immediate close.
    const id = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handler);
    };
  }, [calIsOpen]);

  function calSelectDay(day: number) {
    const newDob = `${String(day).padStart(2, "0")}/${String(calMonth + 1).padStart(2, "0")}/${calYear}`;
    setForm((p) => ({ ...p, dob: newDob }));
    setCalSelD(day);
    setCalSelM(calMonth);
    setCalSelY(calYear);
    setErrors((p) =>
      Object.fromEntries(Object.entries(p).filter(([key]) => key !== "dob")),
    );
    setCalIsOpen(false);
  }

  function renderCalDays() {
    const today = new Date();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: React.ReactNode[] = [];
    for (const d of DAYS_SHORT) {
      cells.push(
        <div key={`dow-${d}`} className="mkjc-cal-dow">
          {d}
        </div>,
      );
    }
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        calMonth === today.getMonth() &&
        calYear === today.getFullYear();
      const isSel =
        calSelD === day && calSelM === calMonth && calSelY === calYear;
      const dayNum = day;
      cells.push(
        <button
          key={day}
          type="button"
          className={`mkjc-cal-day${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
          onClick={() => calSelectDay(dayNum)}
          aria-label={`Select day ${day}`}
        >
          {day}
        </button>,
      );
    }
    return cells;
  }

  // ── Calendar month navigation ─────────────────────────────────────────
  function calPrev() {
    if (calYmMode) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  }
  function calNext() {
    if (calYmMode) return;
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  }

  // ── Syllabus tooltip ─────────────────────────────────────────────────
  const [activeSyl, setActiveSyl] = useState<string | null>(null);

  // ── Field helpers ────────────────────────────────────────────────────
  function setField(k: keyof FormData, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }
  function clearErr(k: keyof FormData) {
    setErrors((p) =>
      Object.fromEntries(Object.entries(p).filter(([key]) => key !== k)),
    );
  }

  // ── Aadhaar formatter ─────────────────────────────────────────────────
  function handleAadhaarInput(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    let out = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) out += " ";
      out += digits[i];
    }
    setField("aadhaar", out);
  }

  // ── DOB auto-slash ────────────────────────────────────────────────────
  function handleDobInput(raw: string) {
    const digits = raw.replace(/\D/g, "");
    let fmt = "";
    if (digits.length <= 2) fmt = digits;
    else if (digits.length <= 4)
      fmt = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    else
      fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    setField("dob", fmt);
  }

  function handleDobKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const inp = e.currentTarget;
      const pos = inp.selectionStart ?? 0;
      if (pos > 0 && form.dob[pos - 1] === "/") {
        e.preventDefault();
        const newVal = form.dob.slice(0, pos - 1) + form.dob.slice(pos);
        setField("dob", newVal);
        requestAnimationFrame(() => inp.setSelectionRange(pos - 1, pos - 1));
      }
    }
  }

  // ── Validation ────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = "Full Name is required";
    if (!form.dob.trim()) errs.dob = "Date of Birth is required";
    else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.dob.trim()))
      errs.dob = "Enter date in DD/MM/YYYY format";
    const aadhaarDigits = form.aadhaar.replace(/\s/g, "");
    if (!aadhaarDigits) errs.aadhaar = "Aadhaar Number is required";
    else if (aadhaarDigits.length !== 12)
      errs.aadhaar = "Enter valid 12-digit Aadhaar";
    if (form.email.trim() && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email";
    if (!form.mobile.trim()) errs.mobile = "Mobile Number is required";
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
      errs.mobile = "Enter valid 10-digit mobile";
    if (!form.fatherName.trim()) errs.fatherName = "Father's Name is required";
    if (!form.parentMobile.trim())
      errs.parentMobile = "Parent Mobile is required";
    else if (!/^[6-9]\d{9}$/.test(form.parentMobile.trim()))
      errs.parentMobile = "Enter valid 10-digit mobile";
    if (!form.motherName.trim()) errs.motherName = "Mother's Name is required";
    if (!form.district) errs.district = "District is required";
    if (!form.group12) errs.group12 = "12th Group is required";
    if (!form.choice1) errs.choice1 = "First Choice is required";
    if (!form.choice2) errs.choice2 = "Second Choice is required";
    if (!form.choice3) errs.choice3 = "Third Choice is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showToast("Please fill all required fields correctly.", "error");
      return;
    }
    if (!actor || actorLoading) {
      showToast(
        "Connecting to backend, please try again in a moment.",
        "error",
      );
      return;
    }
    setSubmitting(true);
    showToast("Submitting registration...");
    const payload = {
      ...form,
      aadhaar: form.aadhaar.replace(/\s/g, "").trim(),
    };
    try {
      const registrationId = await actor.addRegistration({
        student_name: payload.fullName,
        date_of_birth: payload.dob,
        aadhaar: payload.aadhaar,
        email: payload.email,
        contact_number: payload.mobile,
        whatsapp_number: payload.whatsapp,
        father_name: payload.fatherName,
        parent_mobile: payload.parentMobile,
        mother_name: payload.motherName,
        school_name: payload.school12,
        district: payload.district,
        exam_group: payload.group12,
        choice1: payload.choice1,
        choice2: payload.choice2,
        choice3: payload.choice3,
        test_key: "",
      });
      // Generate student credentials
      let credentials: { user_id: string; password: string } | null = null;
      try {
        credentials = await actor.generateStudentCredentials(
          registrationId,
          payload.mobile,
        );
      } catch {
        // Credentials generation is optional — don't fail the whole flow
      }
      setSuccessData({ ...payload });
      if (credentials) {
        setStudentCredentials(credentials);
      }
      setForm(emptyForm);
      showToast("Registration submitted successfully! ✓");
    } catch (err) {
      console.error("Registration error:", err);
      showToast("Registration failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── PDF Download ──────────────────────────────────────────────────────
  function downloadPDF() {
    if (!successData) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const ts = new Date().toLocaleString();
    const rid = `MKJC-${Date.now()}`;
    const sd = successData;
    win.document.write(`<!DOCTYPE html><html><head><title>MKJC Registration - ${sd.fullName}</title>
    <style>body{font-family:Arial,sans-serif;margin:20px;color:#333;line-height:1.6;background:#fff}.header{text-align:center;border-bottom:2px solid #f5c518;padding-bottom:20px;margin-bottom:30px}.college-name{font-size:20px;font-weight:bold;color:#1a2d6b;margin-bottom:10px}.location{font-size:16px;color:#666;margin-bottom:10px}.accred{font-size:11px;color:#777;line-height:1.4;margin-bottom:15px}.exam-title{font-size:18px;font-weight:bold;color:#f5c518;text-transform:uppercase;margin-bottom:10px}.form-title{font-size:14px;color:#666;font-weight:bold}.meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px;color:#666;border-bottom:1px solid #ddd;padding-bottom:10px}.section{margin-bottom:25px;border:1px solid #ddd;padding:15px;border-radius:5px}.section-title{font-size:16px;font-weight:bold;color:#1a2d6b;margin-bottom:15px;border-bottom:1px solid #f5c518;padding-bottom:5px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.item{background:#f9f9f9;padding:10px;border-radius:4px;border-left:3px solid #f5c518}.lbl{font-size:11px;font-weight:bold;color:#666;text-transform:uppercase;margin-bottom:5px}.val{font-size:14px;color:#333;font-weight:500}.full{grid-column:1/-1}.footer-p{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;text-align:center;font-size:11px;color:#666}@media print{body{margin:0}.no-print{display:none}}</style></head>
    <body><div class="header"><div style="font-size:36px;margin-bottom:15px">&#127963;</div><div class="college-name">MARUDHAR KESARI JAIN COLLEGE FOR WOMEN (AUTONOMOUS)</div><div class="location">VANIYAMBADI</div><div class="accred">Recognized u/s 2(f)&amp;12(B) by UGG Act 1956 | Permanently affiliated to Thiruvalluvar University<br>Accredited with A+ Grade by NAAC (4th cycle) | Supported by DST FIST</div><div class="exam-title">MKJC SCHOLARSHIP EXAM 2026</div><div class="form-title">REGISTRATION FORM</div></div>
    <div class="meta"><div>Submitted on: ${ts}</div><div>Registration ID: ${rid}</div></div>
    <div class="section"><div class="section-title">Personal Information</div><div class="grid"><div class="item full"><div class="lbl">Full Name</div><div class="val">${sd.fullName || "-"}</div></div><div class="item"><div class="lbl">Date of Birth</div><div class="val">${sd.dob || "-"}</div></div><div class="item"><div class="lbl">Aadhaar Number</div><div class="val">${sd.aadhaar || "-"}</div></div></div></div>
    <div class="section"><div class="section-title">Contact Details</div><div class="grid"><div class="item"><div class="lbl">Email</div><div class="val">${sd.email || "-"}</div></div><div class="item"><div class="lbl">Mobile</div><div class="val">${sd.mobile || "-"}</div></div><div class="item"><div class="lbl">WhatsApp</div><div class="val">${sd.whatsapp || "-"}</div></div></div></div>
    <div class="section"><div class="section-title">Parent / Guardian Details</div><div class="grid"><div class="item full"><div class="lbl">Father's Name</div><div class="val">${sd.fatherName || "-"}</div></div><div class="item"><div class="lbl">Parent Mobile</div><div class="val">${sd.parentMobile || "-"}</div></div><div class="item full"><div class="lbl">Mother's Name</div><div class="val">${sd.motherName || "-"}</div></div></div></div>
    <div class="section"><div class="section-title">Academic Details</div><div class="grid"><div class="item full"><div class="lbl">School Name (12th)</div><div class="val">${sd.school12 || "-"}</div></div><div class="item"><div class="lbl">District</div><div class="val">${sd.district || "-"}</div></div><div class="item"><div class="lbl">12th Group</div><div class="val">${sd.group12 || "-"}</div></div></div></div>
    <div class="section"><div class="section-title">Course Preferences</div><div class="grid"><div class="item full"><div class="lbl">First Choice</div><div class="val">${sd.choice1 || "-"}</div></div><div class="item full"><div class="lbl">Second Choice</div><div class="val">${sd.choice2 || "-"}</div></div><div class="item full"><div class="lbl">Third Choice</div><div class="val">${sd.choice3 || "-"}</div></div></div></div>
    <div class="footer-p"><div style="margin-bottom:8px">Marudhar Kesari Jain College for Women (Autonomous), Vaniyambadi</div><div>Mobile: +91 88258 87756 | Email: principal@mkjc.in | Website: www.mkjc.in</div></div>
    <div class="no-print" style="text-align:center;margin-top:30px;padding:20px;background:#f0f0f0;border-radius:5px"><p style="margin:0;color:#666">Use your browser's print function (Ctrl+P) and select "Save as PDF" to download.</p></div>
    </body></html>`);
    win.document.close();
    win.onload = () => {
      setTimeout(() => win.print(), 500);
    };
    showToast('Print dialog opened! Select "Save as PDF" to download. ✓');
  }

  // ── Select programme optgroups ────────────────────────────────────────
  function ProgrammeSelect({
    id,
    value,
    onChange,
    ocid,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    ocid?: string;
  }) {
    return (
      <select
        id={id}
        data-ocid={ocid}
        className="mkjc-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={id}
      >
        <option value="">Select Programme</option>
        {Object.entries(PROGRAMMES).map(([group, items]) => (
          <optgroup key={group} label={`-- ${group.toUpperCase()} --`}>
            {items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mkjc-body">
      {/* Toast */}
      {toast && (
        <output className={`mkjc-toast ${toast.type} show`} aria-live="polite">
          {toast.msg}
        </output>
      )}

      {/* Calendar Popup */}
      {calIsOpen && (
        <div
          ref={calPopupRef}
          className="mkjc-cal-popup"
          style={{ top: calPos.top, left: calPos.left }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="mkjc-cal-head">
            <button type="button" onClick={calPrev} aria-label="Previous month">
              &#8249;
            </button>
            <button
              type="button"
              className="mkjc-cal-my"
              onClick={() => setCalYmMode((m) => !m)}
              aria-label="Toggle month/year picker"
            >
              {MONTHS[calMonth]} {calYear}
            </button>
            <button type="button" onClick={calNext} aria-label="Next month">
              &#8250;
            </button>
          </div>
          {calYmMode ? (
            <div className="mkjc-ym-picker">
              <div className="mkjc-ym-label">Month</div>
              <div className="mkjc-ym-grid">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={`mkjc-ym-item${i === calMonth ? " selected" : ""}`}
                    onClick={() => {
                      setCalMonth(i);
                      setCalYmMode(false);
                    }}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div className="mkjc-ym-label" style={{ marginTop: 10 }}>
                Year
              </div>
              <div className="mkjc-ym-grid">
                {Array.from({ length: 16 }, (_, i) => calYear - 10 + i).map(
                  (yr) => (
                    <button
                      key={yr}
                      type="button"
                      className={`mkjc-ym-item${yr === calYear ? " selected" : ""}`}
                      onClick={() => {
                        setCalYear(yr);
                        setCalYmMode(false);
                      }}
                    >
                      {yr}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="mkjc-cal-grid">{renderCalDays()}</div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <dialog
          open
          className="mkjc-success-bg"
          aria-label="Registration Successful"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSuccessData(null);
              setStudentCredentials(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setSuccessData(null);
              setStudentCredentials(null);
            }
          }}
        >
          <div className="mkjc-success-modal">
            <div className="mkjc-success-header">
              <span className="mkjc-check-icon" aria-hidden="true">
                &#10003;
              </span>
              <h2>Registration Successful!</h2>
              <p>Your registration has been submitted successfully</p>
            </div>
            <div className="mkjc-success-details">
              <div className="mkjc-detail-section">
                <div className="mkjc-detail-title">Personal Information</div>
                <div className="mkjc-detail-grid">
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">Full Name</div>
                    <div className="mkjc-detail-value">
                      {successData.fullName || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">Date of Birth</div>
                    <div className="mkjc-detail-value">
                      {successData.dob || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">Aadhaar Number</div>
                    <div className="mkjc-detail-value">
                      {successData.aadhaar || "-"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mkjc-detail-section">
                <div className="mkjc-detail-title">Contact Details</div>
                <div className="mkjc-detail-grid">
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">Email</div>
                    <div className="mkjc-detail-value">
                      {successData.email || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">Mobile</div>
                    <div className="mkjc-detail-value">
                      {successData.mobile || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">WhatsApp</div>
                    <div className="mkjc-detail-value">
                      {successData.whatsapp || "-"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mkjc-detail-section">
                <div className="mkjc-detail-title">
                  Parent / Guardian Details
                </div>
                <div className="mkjc-detail-grid">
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">Father's Name</div>
                    <div className="mkjc-detail-value">
                      {successData.fatherName || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">Parent Mobile</div>
                    <div className="mkjc-detail-value">
                      {successData.parentMobile || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">Mother's Name</div>
                    <div className="mkjc-detail-value">
                      {successData.motherName || "-"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mkjc-detail-section">
                <div className="mkjc-detail-title">Academic Details</div>
                <div className="mkjc-detail-grid">
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">School Name (12th)</div>
                    <div className="mkjc-detail-value">
                      {successData.school12 || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">District</div>
                    <div className="mkjc-detail-value">
                      {successData.district || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item">
                    <div className="mkjc-detail-label">12th Group</div>
                    <div className="mkjc-detail-value">
                      {successData.group12 || "-"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mkjc-detail-section">
                <div className="mkjc-detail-title">Course Preferences</div>
                <div className="mkjc-detail-grid">
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">First Choice</div>
                    <div className="mkjc-detail-value">
                      {successData.choice1 || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">Second Choice</div>
                    <div className="mkjc-detail-value">
                      {successData.choice2 || "-"}
                    </div>
                  </div>
                  <div className="mkjc-detail-item full">
                    <div className="mkjc-detail-label">Third Choice</div>
                    <div className="mkjc-detail-value">
                      {successData.choice3 || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {studentCredentials && (
              <div
                style={{
                  background: "#0d3a2e",
                  border: "2px solid #0fa88a",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  margin: "0 0 16px",
                }}
              >
                <div
                  style={{
                    color: "#0fa88a",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    marginBottom: "10px",
                  }}
                >
                  🔐 Your Login Credentials
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      background: "#1a2750",
                      padding: "10px 12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        color: "#7eb3f5",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      User ID
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {studentCredentials.user_id}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#1a2750",
                      padding: "10px 12px",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        color: "#7eb3f5",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Password
                    </div>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "1rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {studentCredentials.password}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#7eb3f5" }}>
                  ⚠️ Please save these credentials. You will need them to log in
                  and take your exam.
                </div>
                <button
                  type="button"
                  style={{
                    marginTop: "10px",
                    background: "#1a3acc",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "7px 14px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  data-ocid="home.copy_credentials.button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(
                        `User ID: ${studentCredentials.user_id}\nPassword: ${studentCredentials.password}`,
                      )
                      .catch(() => {});
                    showToast("Credentials copied to clipboard! ✓");
                  }}
                >
                  📋 Copy Credentials
                </button>
              </div>
            )}
            <div className="mkjc-success-actions">
              <button
                type="button"
                className="mkjc-btn-download"
                data-ocid="home.download_pdf.button"
                onClick={downloadPDF}
              >
                <span aria-hidden="true">📥</span> Download PDF
              </button>
              <button
                type="button"
                className="mkjc-btn-new"
                data-ocid="home.new_registration.button"
                onClick={() => {
                  setSuccessData(null);
                  setStudentCredentials(null);
                }}
              >
                <span aria-hidden="true">➕</span> New Registration
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* Header */}
      <div className="mkjc-header">
        <img
          src="https://www.mkjc.in/download/downloads/2003261054101332.png"
          alt="Marudhar Kesari Jain College Logo"
          style={{
            height: 76,
            marginBottom: 10,
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
        <h1>
          MARUDHAR KESARI JAIN COLLEGE
          <br />
          FOR WOMEN (AUTONOMOUS)
        </h1>
        <div className="mkjc-national">VANIYAMBADI</div>
        <div className="mkjc-accred">
          Recognized u/s 2(f)&amp;12(B) by UGG Act 1956 | Permanently affiliated
          to Thiruvalluvar University
        </div>
        <div className="mkjc-accred">
          Accredited with A+ Grade by NAAC (4th cycle) | Supported by DST FIST
        </div>
        <h2>MKJC Online Examination Portal</h2>
        <p>
          A great opportunity to step into one of the{" "}
          <span className="mkjc-gold">Best Women&#39;s College</span> with an
          attractive <span className="mkjc-gold">FEE CONCESSION</span>
        </p>
        {/* Header action buttons */}
        <div className="mkjc-header-btns">
          <button
            type="button"
            className="mkjc-header-admin-btn"
            data-ocid="home.admin_button"
            onClick={() => setPage("admin")}
            aria-label="Go to Admin Panel"
          >
            &#9881; Admin
          </button>
          <button
            type="button"
            className="mkjc-header-student-btn"
            data-ocid="home.student_login_button"
            onClick={() => setPage("student-login")}
            aria-label="Student Login"
          >
            Student Login
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mkjc-grid">
        {/* LEFT SIDEBAR */}
        <div>
          <div className="mkjc-panel">
            <div className="mkjc-panel-title">Programmes Offered</div>
            <div className="mkjc-prog-stats">
              {[
                { n: "22", l: "UG" },
                { n: "15", l: "PG" },
                { n: "10", l: "Ph.D" },
                { n: "04", l: "Diploma" },
              ].map((s) => (
                <div key={s.l} className="mkjc-prog-stat-box">
                  <div className="mkjc-prog-stat-num">{s.n}</div>
                  <div className="mkjc-prog-stat-label">{s.l}</div>
                </div>
              ))}
            </div>
            {Object.entries(PROGRAMMES).map(([cat, items]) => (
              <div key={cat}>
                <div className="mkjc-prog-cat">{cat}</div>
                <ul className="mkjc-prog-list">
                  {items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER FORM */}
        <div>
          <div className="mkjc-form-card">
            <div className="mkjc-form-header">
              <svg
                width="17"
                height="17"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" fill="#fff" />
                <path
                  d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              REGISTRATION FORM
            </div>
            <div className="mkjc-form-body">
              <form id="regForm" onSubmit={handleSubmit} noValidate>
                {/* Personal Information */}
                <div className="mkjc-section-heading">Personal Information</div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="fullName">
                    Full Name{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="fullName"
                    data-ocid="home.full_name.input"
                    type="text"
                    className="mkjc-input mkjc-input-no-icon"
                    placeholder="As per school records"
                    value={form.fullName}
                    onChange={(e) => {
                      setField("fullName", e.target.value);
                      clearErr("fullName");
                    }}
                    aria-required="true"
                    aria-describedby={
                      errors.fullName ? "err-fullName" : undefined
                    }
                  />
                  <div className="mkjc-field-hint">As per school records</div>
                  {errors.fullName && (
                    <div
                      id="err-fullName"
                      className="mkjc-field-err"
                      role="alert"
                    >
                      {errors.fullName}
                    </div>
                  )}
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="dob">
                    Date of Birth{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <div className="mkjc-dob-wrap">
                    <input
                      id="dob"
                      data-ocid="home.dob.input"
                      type="text"
                      className="mkjc-input mkjc-input-no-icon"
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      autoComplete="off"
                      value={form.dob}
                      onChange={(e) => {
                        handleDobInput(e.target.value);
                        clearErr("dob");
                      }}
                      onKeyDown={handleDobKeyDown}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      ref={calBtnRef}
                      className="mkjc-cal-btn"
                      aria-label="Open date picker"
                      data-ocid="home.cal_toggle.button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        calIsOpen ? setCalIsOpen(false) : openCal();
                      }}
                    >
                      &#128197;
                    </button>
                  </div>
                  {errors.dob && (
                    <div id="err-dob" className="mkjc-field-err" role="alert">
                      {errors.dob}
                    </div>
                  )}
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="aadhaar">
                    Aadhaar Number{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="aadhaar"
                    data-ocid="home.aadhaar.input"
                    type="text"
                    className="mkjc-input mkjc-input-no-icon"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    value={form.aadhaar}
                    onChange={(e) => {
                      handleAadhaarInput(e.target.value);
                      clearErr("aadhaar");
                    }}
                    aria-required="true"
                  />
                  {errors.aadhaar && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.aadhaar}
                    </div>
                  )}
                </div>

                <hr className="mkjc-divider" />

                {/* Contact Details */}
                <div className="mkjc-section-heading">Contact Details</div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="email">
                    Email Address
                  </label>
                  <div className="mkjc-field-wrap">
                    <span className="mkjc-field-icon" aria-hidden="true">
                      &#9993;
                    </span>
                    <input
                      id="email"
                      data-ocid="home.email.input"
                      type="email"
                      className="mkjc-input"
                      placeholder="student@example.com"
                      value={form.email}
                      onChange={(e) => {
                        setField("email", e.target.value);
                        clearErr("email");
                      }}
                    />
                  </div>
                  {errors.email && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.email}
                    </div>
                  )}
                </div>

                <div className="mkjc-form-row">
                  <div className="mkjc-form-group">
                    <label className="mkjc-field-label" htmlFor="mobile">
                      Mobile Number{" "}
                      <span className="mkjc-req" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <div className="mkjc-field-wrap">
                      <span className="mkjc-field-icon" aria-hidden="true">
                        &#128222;
                      </span>
                      <input
                        id="mobile"
                        data-ocid="home.mobile.input"
                        type="tel"
                        className="mkjc-input"
                        placeholder="10-digit mobile"
                        maxLength={10}
                        value={form.mobile}
                        onChange={(e) => {
                          setField("mobile", e.target.value);
                          clearErr("mobile");
                        }}
                        aria-required="true"
                      />
                    </div>
                    {errors.mobile && (
                      <div className="mkjc-field-err" role="alert">
                        {errors.mobile}
                      </div>
                    )}
                  </div>
                  <div className="mkjc-form-group">
                    <label className="mkjc-field-label" htmlFor="whatsapp">
                      WhatsApp Number
                    </label>
                    <div className="mkjc-field-wrap">
                      <span className="mkjc-field-icon" aria-hidden="true">
                        &#128172;
                      </span>
                      <input
                        id="whatsapp"
                        data-ocid="home.whatsapp.input"
                        type="tel"
                        className="mkjc-input"
                        placeholder="10-digit mobile"
                        maxLength={10}
                        value={form.whatsapp}
                        onChange={(e) => setField("whatsapp", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <hr className="mkjc-divider" />

                {/* Parent / Guardian */}
                <div className="mkjc-section-heading">
                  Parent / Guardian Details
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="fatherName">
                    Father&#39;s Name{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="fatherName"
                    data-ocid="home.father_name.input"
                    type="text"
                    className="mkjc-input mkjc-input-no-icon"
                    placeholder="Father's Name"
                    value={form.fatherName}
                    onChange={(e) => {
                      setField("fatherName", e.target.value);
                      clearErr("fatherName");
                    }}
                    aria-required="true"
                  />
                  {errors.fatherName && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.fatherName}
                    </div>
                  )}
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="parentMobile">
                    Parent Mobile{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <div className="mkjc-field-wrap">
                    <span className="mkjc-field-icon" aria-hidden="true">
                      &#128222;
                    </span>
                    <input
                      id="parentMobile"
                      data-ocid="home.parent_mobile.input"
                      type="tel"
                      className="mkjc-input"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={form.parentMobile}
                      onChange={(e) => {
                        setField("parentMobile", e.target.value);
                        clearErr("parentMobile");
                      }}
                      aria-required="true"
                    />
                  </div>
                  {errors.parentMobile && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.parentMobile}
                    </div>
                  )}
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="motherName">
                    Mother&#39;s Name{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="motherName"
                    data-ocid="home.mother_name.input"
                    type="text"
                    className="mkjc-input mkjc-input-no-icon"
                    placeholder="Mother's Name"
                    value={form.motherName}
                    onChange={(e) => {
                      setField("motherName", e.target.value);
                      clearErr("motherName");
                    }}
                    aria-required="true"
                  />
                  {errors.motherName && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.motherName}
                    </div>
                  )}
                </div>

                <hr className="mkjc-divider" />

                {/* Academic Details */}
                <div className="mkjc-section-heading">Academic Details</div>

                <div className="mkjc-form-row">
                  <div className="mkjc-form-group">
                    <label className="mkjc-field-label" htmlFor="school12">
                      12th School Name
                    </label>
                    <input
                      id="school12"
                      data-ocid="home.school12.input"
                      type="text"
                      className="mkjc-input mkjc-input-no-icon"
                      placeholder="School Name"
                      value={form.school12}
                      onChange={(e) => setField("school12", e.target.value)}
                    />
                  </div>
                  <div className="mkjc-form-group">
                    <label className="mkjc-field-label" htmlFor="district">
                      District{" "}
                      <span className="mkjc-req" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <select
                      id="district"
                      data-ocid="home.district.select"
                      className="mkjc-select"
                      value={form.district}
                      onChange={(e) => {
                        setField("district", e.target.value);
                        clearErr("district");
                      }}
                      aria-required="true"
                    >
                      <option value="">Select District</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <div className="mkjc-field-err" role="alert">
                        {errors.district}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="group12">
                    12th Group{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="group12"
                    data-ocid="home.group12.select"
                    className="mkjc-select"
                    value={form.group12}
                    onChange={(e) => {
                      setField("group12", e.target.value);
                      clearErr("group12");
                    }}
                    aria-required="true"
                  >
                    <option value="">Select Group</option>
                    {GROUPS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {errors.group12 && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.group12}
                    </div>
                  )}
                </div>

                <hr className="mkjc-divider" />

                {/* Course Preferred */}
                <div className="mkjc-section-heading">
                  Course Preferred in MKJC
                </div>

                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="choice1">
                    First Choice{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <ProgrammeSelect
                    id="choice1"
                    value={form.choice1}
                    onChange={(v) => {
                      setField("choice1", v);
                      clearErr("choice1");
                    }}
                    ocid="home.choice1.select"
                  />
                  {errors.choice1 && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.choice1}
                    </div>
                  )}
                </div>
                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="choice2">
                    Second Choice{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <ProgrammeSelect
                    id="choice2"
                    value={form.choice2}
                    onChange={(v) => {
                      setField("choice2", v);
                      clearErr("choice2");
                    }}
                    ocid="home.choice2.select"
                  />
                  {errors.choice2 && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.choice2}
                    </div>
                  )}
                </div>
                <div className="mkjc-form-group">
                  <label className="mkjc-field-label" htmlFor="choice3">
                    Third Choice{" "}
                    <span className="mkjc-req" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <ProgrammeSelect
                    id="choice3"
                    value={form.choice3}
                    onChange={(v) => {
                      setField("choice3", v);
                      clearErr("choice3");
                    }}
                    ocid="home.choice3.select"
                  />
                  {errors.choice3 && (
                    <div className="mkjc-field-err" role="alert">
                      {errors.choice3}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="mkjc-submit-btn"
                  data-ocid="home.submit.button"
                  disabled={submitting}
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT REGISTRATION"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div>
          <div className="mkjc-panel">
            <div className="mkjc-panel-title">Why Choose MKJC?</div>
            <ul className="mkjc-why-list">
              {WHY_ITEMS.map((item) => (
                <li key={item.main} className="mkjc-why-item">
                  <div className="mkjc-why-main">{item.main}</div>
                  {item.sub && <div className="mkjc-why-sub">{item.sub}</div>}
                </li>
              ))}
            </ul>
          </div>
          <div className="mkjc-exam-card">
            <div className="mkjc-exam-title">Examination Instructions</div>
            <ul className="mkjc-exam-list">
              <li>
                <span className="mkjc-exam-label">Format:</span> 50 MCQs
              </li>
              <li>
                <span className="mkjc-exam-label">Duration:</span> 1 hour (60
                minutes)
              </li>
              <li>
                <span className="mkjc-exam-label">Syllabus:</span> Questions
                cover{" "}
                {SYL_GROUPS.map((sg, i) => (
                  <span key={sg.name}>
                    {i > 0 && ", "}
                    <button
                      type="button"
                      className="mkjc-syl-group"
                      onClick={() =>
                        setActiveSyl(activeSyl === sg.name ? null : sg.name)
                      }
                    >
                      {sg.name}
                    </button>
                    {activeSyl === sg.name && (
                      <span className="mkjc-syl-tooltip" role="tooltip">
                        {sg.tooltip}
                        <button
                          type="button"
                          className="mkjc-syl-close"
                          aria-label="Close syllabus tooltip"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSyl(null);
                          }}
                        >
                          &times;
                        </button>
                      </span>
                    )}
                  </span>
                ))}
              </li>
              <li className="mkjc-prohibited">
                <span className="mkjc-exam-label">Prohibited Items:</span>{" "}
                Mobile phones, smartwatches, and programmable calculators are
                strictly prohibited
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mkjc-footer">
        Marudhar Kesari Jain College for Women (Autonomous), Vaniyambadi
        <br />
        Mobile: +91 88258 87756 &nbsp;|&nbsp; Email: principal@mkjc.in
        &nbsp;|&nbsp; Website:{" "}
        <a href="http://www.mkjc.in" style={{ color: "#ffd700" }}>
          www.mkjc.in
        </a>
      </footer>
    </div>
  );
}
