// Custom exams stored in localStorage so both AdminPage and HomePage share the same data

export interface CustomExam {
  id: string; // auto-generated, e.g. "EXAM-001"
  exam_name: string;
  exam_date: string; // ISO date string "YYYY-MM-DD"
  exam_time: string; // "HH:MM"
  duration: number; // minutes
  num_questions: number;
  created_at: string;
}

const STORAGE_KEY = "mkjc_custom_exams";

function loadExams(): CustomExam[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomExam[]) : [];
  } catch {
    return [];
  }
}

function saveExams(exams: CustomExam[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
}

function generateId(exams: CustomExam[]): string {
  const nums = exams
    .map((e) => {
      const m = e.id.match(/^EXAM-0*(\d+)$/);
      return m ? Number.parseInt(m[1], 10) : 0;
    })
    .filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `EXAM-${String(next).padStart(3, "0")}`;
}

export function getExams(): CustomExam[] {
  return loadExams();
}

export function addExam(
  data: Omit<CustomExam, "id" | "created_at">,
): CustomExam {
  const exams = loadExams();
  const newExam: CustomExam = {
    ...data,
    id: generateId(exams),
    created_at: new Date().toISOString(),
  };
  exams.push(newExam);
  saveExams(exams);
  return newExam;
}

export function deleteExam(id: string): void {
  const exams = loadExams().filter((e) => e.id !== id);
  saveExams(exams);
}
