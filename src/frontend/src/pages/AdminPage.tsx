import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Edit,
  FileDown,
  FileUp,
  Image as ImageIcon,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Printer,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Type,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Lang } from "../App";
import type {
  Exam,
  QuestionDTO,
  QuizResponse,
  Registration,
} from "../backend.d";
import { QuestionTypeDTO } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface AdminPageProps {
  lang: Lang;
}

const testKeys = ["Test1", "Test2", "Test3"];

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "staff@318";

const emptyQuestion = (): QuestionDTO => ({
  test_key: "Test1",
  question_type: QuestionTypeDTO.text,
  question_text_en: "",
  question_image_en: new Uint8Array(),
  option_a_en: "",
  option_b_en: "",
  option_c_en: "",
  option_d_en: "",
  correct_answer_en: "",
  question_text_ta: "",
  question_image_ta: new Uint8Array(),
  option_a_ta: "",
  option_b_ta: "",
  option_c_ta: "",
  option_d_ta: "",
  correct_answer_ta: "",
  question_order: 0n,
  is_active: true,
});

// ── CSV helpers ────────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  "question_order",
  "test_key",
  "question_type",
  "question_text_en",
  "option_a_en",
  "option_b_en",
  "option_c_en",
  "option_d_en",
  "correct_answer_en",
  "question_text_ta",
  "option_a_ta",
  "option_b_ta",
  "option_c_ta",
  "option_d_ta",
  "correct_answer_ta",
];

function escapeCsv(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function questionsToCsv(questions: QuestionDTO[]): string {
  const rows = questions.map((q) =>
    [
      Number(q.question_order),
      q.test_key,
      "question_type" in q &&
      JSON.stringify(q.question_type) === '{"image":null}'
        ? "image"
        : "text",
      q.question_text_en,
      q.option_a_en,
      q.option_b_en,
      q.option_c_en,
      q.option_d_en,
      q.correct_answer_en,
      q.question_text_ta,
      q.option_a_ta,
      q.option_b_ta,
      q.option_c_ta,
      q.option_d_ta,
      q.correct_answer_ta,
    ]
      .map((v) => escapeCsv(String(v)))
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvToQuestions(csvText: string): QuestionDTO[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  // skip header
  const dataLines = lines.slice(1);
  return dataLines.map((line) => {
    // simple CSV parse (handles quoted fields)
    const cols: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === "," && !inQ) {
        cols.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);

    const [
      order,
      test_key,
      qtype,
      question_text_en,
      option_a_en,
      option_b_en,
      option_c_en,
      option_d_en,
      correct_answer_en,
      question_text_ta,
      option_a_ta,
      option_b_ta,
      option_c_ta,
      option_d_ta,
      correct_answer_ta,
    ] = cols.map((c) => c ?? "");

    return {
      question_order: BigInt(order || "0"),
      test_key: test_key || "Test1",
      question_type:
        qtype === "image" ? QuestionTypeDTO.image : QuestionTypeDTO.text,
      question_text_en: question_text_en || "",
      option_a_en: option_a_en || "",
      option_b_en: option_b_en || "",
      option_c_en: option_c_en || "",
      option_d_en: option_d_en || "",
      correct_answer_en: correct_answer_en || "",
      question_text_ta: question_text_ta || "",
      option_a_ta: option_a_ta || "",
      option_b_ta: option_b_ta || "",
      option_c_ta: option_c_ta || "",
      option_d_ta: option_d_ta || "",
      correct_answer_ta: correct_answer_ta || "",
      question_image_en: new Uint8Array(),
      question_image_ta: new Uint8Array(),
      is_active: true,
    } as QuestionDTO;
  });
}

function isImageType(q: QuestionDTO) {
  return JSON.stringify(q.question_type) === '{"image":null}';
}

// ── Print helper ───────────────────────────────────────────────────────────────
function printQuestionPaper(questions: QuestionDTO[], testKey: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${testKey} – Question Paper</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #000; }
        h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
        h2 { text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 28px; color: #444; }
        .question { margin-bottom: 24px; page-break-inside: avoid; }
        .qnum { font-weight: bold; margin-right: 6px; }
        .options { margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; padding-left: 20px; }
        .option { font-size: 14px; }
        .tamil { margin-top: 4px; color: #333; font-size: 14px; }
        hr { margin: 32px 0; border: none; border-top: 1px solid #ccc; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h1>MKJC Scholarship Exam – ${testKey}</h1>
      <h2>Question Paper</h2>
      ${questions
        .map(
          (q, i) => `
        <div class="question">
          <div>
            <span class="qnum">${i + 1}.</span>
            <span>${q.question_text_en || "[Image Question]"}${
              q.question_text_ta
                ? `<span class="tamil"> / ${q.question_text_ta}</span>`
                : ""
            }</span>
          </div>
          <div class="options">
            <div class="option">(A) ${q.option_a_en}${q.option_a_ta ? ` / ${q.option_a_ta}` : ""}</div>
            <div class="option">(B) ${q.option_b_en}${q.option_b_ta ? ` / ${q.option_b_ta}` : ""}</div>
            <div class="option">(C) ${q.option_c_en}${q.option_c_ta ? ` / ${q.option_c_ta}` : ""}</div>
            <div class="option">(D) ${q.option_d_en}${q.option_d_ta ? ` / ${q.option_d_ta}` : ""}</div>
          </div>
        </div>
      `,
        )
        .join("")}
    </body>
    </html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminPage({ lang }: AdminPageProps) {
  const { actor } = useActor();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Data
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examForm, setExamForm] = useState({
    exam_name: "",
    exam_date: "",
    exam_time: "",
    duration_minutes: "",
    no_of_questions: "",
  });
  const [savingExam, setSavingExam] = useState(false);
  const [regFilterName, setRegFilterName] = useState("");
  const [regFilterSchool, setRegFilterSchool] = useState("");
  const [regFilterTestKey, setRegFilterTestKey] = useState("all");
  const [resultsFilterName, setResultsFilterName] = useState("");
  const [resultsFilterTestKey, setResultsFilterTestKey] = useState("all");
  const [loadingData, setLoadingData] = useState(false);
  const [filterTestKey, setFilterTestKey] = useState("Test1");

  // Question dialog
  const [qDialogOpen, setQDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    id?: bigint;
    dto: QuestionDTO;
  } | null>(null);
  const [savingQ, setSavingQ] = useState(false);
  const [imagePreviewEn, setImagePreviewEn] = useState<string | null>(null);
  const [imagePreviewTa, setImagePreviewTa] = useState<string | null>(null);

  // CSV import
  const [importingCsv, setImportingCsv] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin || !actor) return;
    loadAllData();
  }, [isAdmin, actor]);

  async function loadAllData() {
    if (!actor) return;
    setLoadingData(true);
    try {
      const [regs, resp, exmList] = await Promise.all([
        actor.getAllRegistrations(),
        actor.getAllQuizResponses(),
        (actor as any).getAllExams(),
      ]);
      setRegistrations(regs);
      setResponses(resp);
      setExams(exmList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }

  const loadQuestions = useCallback(async () => {
    if (!actor) return;
    try {
      const qs = await actor.getQuestionsByTestKey(filterTestKey, false);
      setQuestions(
        qs.sort((a, b) => Number(a.question_order - b.question_order)),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load questions");
    }
  }, [actor, filterTestKey]);

  useEffect(() => {
    if (isAdmin && actor) loadQuestions();
  }, [isAdmin, actor, loadQuestions]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (
      loginForm.username === ADMIN_USERNAME &&
      loginForm.password === ADMIN_PASSWORD
    ) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  }

  async function handleDeleteRegistration(id: bigint) {
    if (!actor) return;
    try {
      await actor.deleteRegistration(id);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      toast.success("Registration deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete registration");
    }
  }

  async function handleDeleteQuestion(testKey: string, questionOrder: bigint) {
    if (!actor) return;
    try {
      await actor.deleteQuestionByTestKeyAndOrder(testKey, questionOrder);
      setQuestions((prev) =>
        prev.filter(
          (q) =>
            !(q.test_key === testKey && q.question_order === questionOrder),
        ),
      );
      toast.success("Question deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete question");
    }
  }

  async function handleSaveQuestion() {
    if (!actor || !editingQuestion) return;
    setSavingQ(true);
    try {
      if (editingQuestion.id !== undefined) {
        await actor.updateQuestion(editingQuestion.id, editingQuestion.dto);
        toast.success("Question updated");
      } else {
        await actor.createQuestion(editingQuestion.dto);
        toast.success("Question created");
      }
      setQDialogOpen(false);
      setEditingQuestion(null);
      setImagePreviewEn(null);
      setImagePreviewTa(null);
      await loadQuestions();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save question");
    } finally {
      setSavingQ(false);
    }
  }

  function updateQField(
    field: keyof QuestionDTO,
    value: string | boolean | bigint | Uint8Array,
  ) {
    if (!editingQuestion) return;
    setEditingQuestion((prev) =>
      prev ? { ...prev, dto: { ...prev.dto, [field]: value } } : null,
    );
  }

  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    lang: "en" | "ta",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result);
        if (lang === "en") {
          updateQField("question_image_en", bytes);
          setImagePreviewEn(URL.createObjectURL(file));
        } else {
          updateQField("question_image_ta", bytes);
          setImagePreviewTa(URL.createObjectURL(file));
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── CSV import ──
  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingCsv(true);
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        let parsed: ReturnType<typeof parseCsvToQuestions>;
        if (isExcel) {
          const data = ev.target?.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          parsed = parseCsvToQuestions(csvText);
        } else {
          const text = ev.target?.result as string;
          parsed = parseCsvToQuestions(text);
        }
        if (parsed.length === 0) {
          toast.error("No valid questions found in file");
          return;
        }
        if (!actor) return;
        let created = 0;
        for (const q of parsed) {
          try {
            await actor.createQuestion(q);
            created++;
          } catch (err) {
            console.error("Failed to import question:", err);
          }
        }
        toast.success(`Imported ${created} of ${parsed.length} questions`);
        await loadQuestions();
      } finally {
        setImportingCsv(false);
        if (csvInputRef.current) csvInputRef.current.value = "";
      }
    };
    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, "UTF-8");
    }
  }

  async function handleCreateExam() {
    if (!actor || !examForm.exam_name) return;
    setSavingExam(true);
    try {
      await (actor as any).createExam(
        examForm.exam_name,
        examForm.exam_date,
        examForm.exam_time,
        BigInt(Number(examForm.duration_minutes) || 0),
        BigInt(Number(examForm.no_of_questions) || 0),
      );
      toast.success("Exam created");
      setExamForm({
        exam_name: "",
        exam_date: "",
        exam_time: "",
        duration_minutes: "",
        no_of_questions: "",
      });
      const updated = await (actor as any).getAllExams();
      setExams(updated);
    } catch (_err) {
      toast.error("Failed to create exam");
    } finally {
      setSavingExam(false);
    }
  }

  async function handleDeleteExam(id: bigint) {
    if (!actor) return;
    try {
      await (actor as any).deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      toast.success("Exam deleted");
    } catch (_err) {
      toast.error("Failed to delete exam");
    }
  }

  function getStudentName(regId: bigint) {
    return (
      registrations.find((r) => r.id === regId)?.student_name ??
      regId.toString()
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg shadow-card p-10 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-navy" />
          </div>
          <h1 className="font-display font-bold text-2xl text-navy mb-2">
            {lang === "en" ? "Admin Login" : "நிர்வாக உள்நுழைவு"}
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            {lang === "en"
              ? "Enter your credentials to access the admin dashboard."
              : "நிர்வாக பலகத்தை அணுக உங்கள் நற்சான்றிதழ்களை உள்ளிடவும்."}
          </p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="username">
                {lang === "en" ? "Username" : "பயனர் பெயர்"}
              </Label>
              <Input
                id="username"
                data-ocid="admin.login.input"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">
                {lang === "en" ? "Password" : "கடவுச்சொல்"}
              </Label>
              <Input
                id="password"
                data-ocid="admin.login.input"
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p
                data-ocid="admin.login.error_state"
                className="text-destructive text-sm font-medium"
              >
                {loginError}
              </p>
            )}
            <Button
              data-ocid="admin.login.primary_button"
              type="submit"
              className="w-full bg-navy text-white hover:bg-navy/90 font-bold"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {lang === "en" ? "Login" : "உள்நுழைய"}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const isCurrentQImage = editingQuestion && isImageType(editingQuestion.dto);

  const filteredRegistrations = registrations.filter((reg) => {
    const nameMatch =
      !regFilterName ||
      reg.student_name.toLowerCase().includes(regFilterName.toLowerCase());
    const schoolMatch =
      !regFilterSchool ||
      reg.school_name.toLowerCase().includes(regFilterSchool.toLowerCase());
    const testKeyMatch =
      regFilterTestKey === "all" || reg.test_key === regFilterTestKey;
    return nameMatch && schoolMatch && testKeyMatch;
  });

  const filteredResponses = responses.filter((r) => {
    const studentName = getStudentName(r.registration_id).toLowerCase();
    const nameMatch =
      !resultsFilterName ||
      studentName.includes(resultsFilterName.toLowerCase());
    const reg = registrations.find((reg) => reg.id === r.registration_id);
    const testKeyMatch =
      resultsFilterTestKey === "all" ||
      (reg && reg.test_key === resultsFilterTestKey);
    return nameMatch && testKeyMatch;
  });

  return (
    <div className="py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-navy">
              {lang === "en" ? "ADMIN DASHBOARD" : "நிர்வாக பலகை"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {lang === "en"
                ? "Manage registrations, questions, and results"
                : "பதிவுகள், கேள்விகள் மற்றும் முடிவுகளை நிர்வகிக்கவும்"}
            </p>
          </div>
          <Button
            data-ocid="admin.logout.button"
            variant="outline"
            className="border-navy text-navy hover:bg-navy/5"
            onClick={() => {
              setIsAuthenticated(false);
              setIsAdmin(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {lang === "en" ? "Logout" : "வெளியேறு"}
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: lang === "en" ? "Total Registrations" : "மொத்த பதிவுகள்",
              value: registrations.length,
            },
            {
              label: lang === "en" ? "Total Questions" : "மொத்த கேள்விகள்",
              value: questions.length,
            },
            {
              label: lang === "en" ? "Quiz Responses" : "தேர்வு பதில்கள்",
              value: responses.length,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-card rounded-lg shadow-card p-6 text-center"
            >
              <div className="font-display font-bold text-3xl text-navy mb-1">
                {kpi.value}
              </div>
              <div className="text-muted-foreground text-sm">{kpi.label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="registrations">
          <TabsList className="mb-6 bg-muted">
            <TabsTrigger
              data-ocid="admin.registrations.tab"
              value="registrations"
            >
              {lang === "en" ? "Registrations" : "பதிவுகள்"}
            </TabsTrigger>
            <TabsTrigger data-ocid="admin.questions.tab" value="questions">
              {lang === "en" ? "Questions" : "கேள்விகள்"}
            </TabsTrigger>
            <TabsTrigger data-ocid="admin.results.tab" value="results">
              {lang === "en" ? "Results" : "முடிவுகள்"}
            </TabsTrigger>
            <TabsTrigger data-ocid="admin.exams.tab" value="exams">
              {lang === "en" ? "Exams" : "தேர்வுகள்"}
            </TabsTrigger>
          </TabsList>

          {/* ── Registrations tab ── */}
          <TabsContent value="registrations">
            <div className="flex flex-wrap gap-2 mb-4">
              <Input
                placeholder={
                  lang === "en" ? "Filter by name..." : "பெயரால் வடிகட்டு..."
                }
                value={regFilterName}
                onChange={(e) => setRegFilterName(e.target.value)}
                className="w-48 h-9"
                data-ocid="admin.reg_filter_name.input"
              />
              <Input
                placeholder={
                  lang === "en" ? "Filter by school..." : "பள்ளியால் வடிகட்டு..."
                }
                value={regFilterSchool}
                onChange={(e) => setRegFilterSchool(e.target.value)}
                className="w-48 h-9"
                data-ocid="admin.reg_filter_school.input"
              />
              <Select
                value={regFilterTestKey}
                onValueChange={setRegFilterTestKey}
              >
                <SelectTrigger
                  className="w-36 h-9"
                  data-ocid="admin.reg_filter_test.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "en" ? "All Tests" : "அனைத்து தேர்வுகள்"}
                  </SelectItem>
                  {testKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              {loadingData ? (
                <div
                  data-ocid="admin.registrations.loading_state"
                  className="flex justify-center items-center py-16"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-navy" />
                </div>
              ) : (
                <Table data-ocid="admin.registrations.table">
                  <TableHeader>
                    <TableRow className="bg-navy/5">
                      <TableHead className="font-semibold text-navy">
                        ID
                      </TableHead>
                      <TableHead className="font-semibold text-navy">
                        {lang === "en" ? "Student Name" : "மாணவர் பெயர்"}
                      </TableHead>
                      <TableHead className="font-semibold text-navy">
                        {lang === "en" ? "School" : "பள்ளி"}
                      </TableHead>
                      <TableHead className="font-semibold text-navy">
                        {lang === "en" ? "Exam Group" : "தேர்வு குழு"}
                      </TableHead>
                      <TableHead className="font-semibold text-navy">
                        {lang === "en" ? "Test" : "தேர்வு"}
                      </TableHead>
                      <TableHead className="font-semibold text-navy">
                        {lang === "en" ? "Contact" : "தொடர்பு"}
                      </TableHead>
                      <TableHead className="text-right font-semibold text-navy">
                        {lang === "en" ? "Actions" : "செயல்கள்"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                          data-ocid="admin.registrations.empty_state"
                        >
                          {lang === "en"
                            ? "No registrations yet."
                            : "இன்னும் பதிவுகள் இல்லை."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRegistrations.map((reg, idx) => (
                        <TableRow
                          key={reg.id.toString()}
                          data-ocid={`admin.registration.item.${idx + 1}`}
                        >
                          <TableCell className="font-mono text-sm">
                            {reg.id.toString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {reg.student_name}
                          </TableCell>
                          <TableCell>{reg.school_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{reg.exam_group}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-navy/10 text-navy border-0">
                              {reg.test_key}
                            </Badge>
                          </TableCell>
                          <TableCell>{reg.contact_number}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              data-ocid={`admin.registration.delete_button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteRegistration(reg.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* ── Questions tab ── */}
          <TabsContent value="questions">
            {/* Hidden CSV input */}
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleCsvImport}
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Select value={filterTestKey} onValueChange={setFilterTestKey}>
                <SelectTrigger
                  data-ocid="admin.questions.filter.select"
                  className="w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {testKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1" />

              {/* Download template */}
              <Button
                variant="outline"
                size="sm"
                className="border-navy/30 text-navy hover:bg-navy/5"
                title="Download CSV Template"
                onClick={() =>
                  downloadCsv(
                    `${CSV_HEADERS.join(",")}\n1,Test1,text,Sample question?,OptionA,OptionB,OptionC,OptionD,OptionA,மாதிரி கேள்வி?,விருப்பம் A,விருப்பம் B,விருப்பம் C,விருப்பம் D,விருப்பம் A`,
                    "questions_template.csv",
                  )
                }
              >
                <FileDown className="h-4 w-4 mr-1" />
                {lang === "en" ? "CSV Template" : "CSV வார்ப்பு"}
              </Button>

              {/* Import CSV */}
              <Button
                variant="outline"
                size="sm"
                className="border-navy/30 text-navy hover:bg-navy/5"
                title="Import from Excel or CSV"
                disabled={importingCsv}
                onClick={() => csvInputRef.current?.click()}
              >
                {importingCsv ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4 mr-1" />
                )}
                {lang === "en" ? "Import Excel/CSV" : "Excel/CSV இறக்கு"}
              </Button>

              {/* Download questions */}
              <Button
                variant="outline"
                size="sm"
                className="border-navy/30 text-navy hover:bg-navy/5"
                disabled={questions.length === 0}
                onClick={() =>
                  downloadCsv(
                    questionsToCsv(questions),
                    `${filterTestKey}_questions.csv`,
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" />
                {lang === "en" ? "Download" : "பதிவிறக்கு"}
              </Button>

              {/* Print question paper */}
              <Button
                variant="outline"
                size="sm"
                className="border-navy/30 text-navy hover:bg-navy/5"
                disabled={questions.length === 0}
                onClick={() => printQuestionPaper(questions, filterTestKey)}
              >
                <Printer className="h-4 w-4 mr-1" />
                {lang === "en" ? "Print" : "அச்சிடு"}
              </Button>

              {/* Add question */}
              <Button
                data-ocid="admin.questions.add.primary_button"
                className="bg-gold text-navy font-bold hover:bg-gold/90"
                size="sm"
                onClick={() => {
                  setEditingQuestion({
                    dto: { ...emptyQuestion(), test_key: filterTestKey },
                  });
                  setImagePreviewEn(null);
                  setImagePreviewTa(null);
                  setQDialogOpen(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                {lang === "en" ? "Add Question" : "கேள்வி சேர்"}
              </Button>
            </div>

            {/* Questions table */}
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              <Table data-ocid="admin.questions.table">
                <TableHeader>
                  <TableRow className="bg-navy/5">
                    <TableHead className="font-semibold text-navy w-12">
                      #
                    </TableHead>
                    <TableHead className="font-semibold text-navy w-20">
                      {lang === "en" ? "Type" : "வகை"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Question (EN)" : "கேள்வி (EN)"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Options" : "விருப்பங்கள்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Correct" : "சரி"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Status" : "நிலை"}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-navy">
                      {lang === "en" ? "Actions" : "செயல்கள்"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                        data-ocid="admin.questions.empty_state"
                      >
                        {lang === "en"
                          ? "No questions for this test."
                          : "இந்த தேர்வுக்கு கேள்விகள் இல்லை."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((q, idx) => (
                      <TableRow
                        key={`q-${q.test_key}-${Number(q.question_order)}`}
                        data-ocid={`admin.question.item.${idx + 1}`}
                      >
                        <TableCell className="font-mono text-sm">
                          {Number(q.question_order)}
                        </TableCell>
                        <TableCell>
                          {isImageType(q) ? (
                            <Badge className="bg-blue-100 text-blue-700 border-0 gap-1">
                              <ImageIcon className="h-3 w-3" /> Image
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 border-0 gap-1">
                              <Type className="h-3 w-3" /> Text
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {isImageType(q) ? (
                            q.question_image_en?.length > 0 ? (
                              <span className="text-blue-600 text-sm italic">
                                📷 Image uploaded
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">
                                No image
                              </span>
                            )
                          ) : (
                            <span className="line-clamp-2">
                              {q.question_text_en}
                            </span>
                          )}
                          {q.question_text_ta && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {q.question_text_ta}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>A: {q.option_a_en}</div>
                          <div>B: {q.option_b_en}</div>
                          <div>C: {q.option_c_en}</div>
                          <div>D: {q.option_d_en}</div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {q.correct_answer_en}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              q.is_active
                                ? "bg-green-100 text-green-700 border-0"
                                : "bg-muted text-muted-foreground border-0"
                            }
                          >
                            {q.is_active
                              ? lang === "en"
                                ? "Active"
                                : "செயலில்"
                              : lang === "en"
                                ? "Inactive"
                                : "செயலற்ற"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            data-ocid={`admin.question.edit_button.${idx + 1}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingQuestion({ dto: { ...q } });
                              setImagePreviewEn(null);
                              setImagePreviewTa(null);
                              setQDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            data-ocid={`admin.question.toggle.${idx + 1}`}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => {
                              toast.info(
                                lang === "en"
                                  ? "Toggle via question ID required"
                                  : "கேள்வி ID தேவை",
                              );
                            }}
                          >
                            {q.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            data-ocid={`admin.question.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleDeleteQuestion(q.test_key, q.question_order)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Results tab ── */}
          <TabsContent value="results">
            <div className="flex flex-wrap gap-2 mb-4">
              <Input
                placeholder={
                  lang === "en" ? "Filter by student..." : "மாணவரால் வடிகட்டு..."
                }
                value={resultsFilterName}
                onChange={(e) => setResultsFilterName(e.target.value)}
                className="w-48 h-9"
                data-ocid="admin.results_filter_name.input"
              />
              <Select
                value={resultsFilterTestKey}
                onValueChange={setResultsFilterTestKey}
              >
                <SelectTrigger
                  className="w-36 h-9"
                  data-ocid="admin.results_filter_test.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {lang === "en" ? "All Tests" : "அனைத்து தேர்வுகள்"}
                  </SelectItem>
                  {testKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              <Table data-ocid="admin.results.table">
                <TableHeader>
                  <TableRow className="bg-navy/5">
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Student" : "மாணவர்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Question" : "கேள்வி"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Answer" : "பதில்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Correct" : "சரி"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Score" : "மதிப்பெண்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                        data-ocid="admin.results.empty_state"
                      >
                        {lang === "en"
                          ? "No results yet."
                          : "இன்னும் முடிவுகள் இல்லை."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResponses.map((r, idx) => (
                      <TableRow
                        key={r.id.toString()}
                        data-ocid={`admin.result.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {getStudentName(r.registration_id)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {r.question_text}
                        </TableCell>
                        <TableCell>{r.student_answer}</TableCell>
                        <TableCell>
                          {r.is_correct ? (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              {lang === "en" ? "Yes" : "ஆம்"}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-0">
                              {lang === "en" ? "No" : "இல்லை"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.score.toString()}/{r.total_questions.toString()}
                        </TableCell>
                        <TableCell>{r.percentage.toFixed(0)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Exams tab ── */}
          <TabsContent value="exams">
            <div className="bg-card rounded-lg shadow-card p-6 mb-6">
              <h3 className="font-semibold text-navy mb-4">
                {lang === "en" ? "Create New Exam" : "புதிய தேர்வு உருவாக்கு"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    {lang === "en" ? "Exam Name *" : "தேர்வு பெயர் *"}
                  </Label>
                  <Input
                    value={examForm.exam_name}
                    onChange={(e) =>
                      setExamForm((p) => ({ ...p, exam_name: e.target.value }))
                    }
                    placeholder="e.g. Mathematics Final"
                    data-ocid="admin.exam_name.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "en" ? "Date" : "தேதி"}</Label>
                  <Input
                    type="date"
                    value={examForm.exam_date}
                    onChange={(e) =>
                      setExamForm((p) => ({ ...p, exam_date: e.target.value }))
                    }
                    data-ocid="admin.exam_date.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "en" ? "Time" : "நேரம்"}</Label>
                  <Input
                    type="time"
                    value={examForm.exam_time}
                    onChange={(e) =>
                      setExamForm((p) => ({ ...p, exam_time: e.target.value }))
                    }
                    data-ocid="admin.exam_time.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {lang === "en" ? "Duration (minutes)" : "காலம் (நிமிடங்கள்)"}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={examForm.duration_minutes}
                    onChange={(e) =>
                      setExamForm((p) => ({
                        ...p,
                        duration_minutes: e.target.value,
                      }))
                    }
                    placeholder="60"
                    data-ocid="admin.exam_duration.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {lang === "en" ? "No. of Questions" : "கேள்விகளின் எண்ணிக்கை"}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={examForm.no_of_questions}
                    onChange={(e) =>
                      setExamForm((p) => ({
                        ...p,
                        no_of_questions: e.target.value,
                      }))
                    }
                    placeholder="30"
                    data-ocid="admin.exam_questions.input"
                  />
                </div>
              </div>
              <Button
                className="mt-4 bg-gold text-navy font-bold hover:bg-gold/90"
                onClick={handleCreateExam}
                disabled={savingExam || !examForm.exam_name}
                data-ocid="admin.exam_create.button"
              >
                {savingExam ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {lang === "en" ? "Create Exam" : "தேர்வு உருவாக்கு"}
              </Button>
            </div>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              <Table data-ocid="admin.exams.table">
                <TableHeader>
                  <TableRow className="bg-navy/5">
                    <TableHead className="font-semibold text-navy">
                      ID
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Exam Name" : "தேர்வு பெயர்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Date" : "தேதி"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Time" : "நேரம்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Duration" : "காலம்"}
                    </TableHead>
                    <TableHead className="font-semibold text-navy">
                      {lang === "en" ? "Questions" : "கேள்விகள்"}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-navy">
                      {lang === "en" ? "Actions" : "செயல்கள்"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                        data-ocid="admin.exams.empty_state"
                      >
                        {lang === "en"
                          ? "No custom exams created yet."
                          : "இன்னும் தனிப்பயன் தேர்வுகள் இல்லை."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    exams.map((exam, idx) => (
                      <TableRow
                        key={exam.id.toString()}
                        data-ocid={`admin.exam.item.${idx + 1}`}
                      >
                        <TableCell className="font-mono text-sm">
                          {exam.id.toString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {exam.exam_name}
                        </TableCell>
                        <TableCell>{exam.exam_date}</TableCell>
                        <TableCell>{exam.exam_time}</TableCell>
                        <TableCell>
                          {exam.duration_minutes.toString()} min
                        </TableCell>
                        <TableCell>{exam.no_of_questions.toString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteExam(exam.id)}
                            data-ocid={`admin.exam.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Question Dialog ── */}
      <Dialog
        open={qDialogOpen}
        onOpenChange={(open) => {
          setQDialogOpen(open);
          if (!open) {
            setEditingQuestion(null);
            setImagePreviewEn(null);
            setImagePreviewTa(null);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="admin.question.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-navy font-display">
              {editingQuestion?.id !== undefined
                ? lang === "en"
                  ? "Edit Question"
                  : "கேள்வி திருத்தம்"
                : lang === "en"
                  ? "Add New Question"
                  : "புதிய கேள்வி சேர்"}
            </DialogTitle>
          </DialogHeader>

          {editingQuestion && (
            <div className="space-y-4 py-2">
              {/* Row: test key + order + type */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Test Key</Label>
                  <Select
                    value={editingQuestion.dto.test_key}
                    onValueChange={(v) => updateQField("test_key", v)}
                  >
                    <SelectTrigger data-ocid="admin.question.test_key.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {testKeys.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "en" ? "Order" : "வரிசை"}</Label>
                  <Input
                    data-ocid="admin.question.order.input"
                    type="number"
                    value={Number(editingQuestion.dto.question_order)}
                    onChange={(e) =>
                      updateQField("question_order", BigInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{lang === "en" ? "Question Type" : "கேள்வி வகை"}</Label>
                  <Select
                    value={isCurrentQImage ? "image" : "text"}
                    onValueChange={(v) =>
                      updateQField(
                        "question_type",
                        v === "image"
                          ? (QuestionTypeDTO.image as unknown as string)
                          : (QuestionTypeDTO.text as unknown as string),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">
                        <span className="flex items-center gap-1.5">
                          <Type className="h-3.5 w-3.5" /> Text
                        </span>
                      </SelectItem>
                      <SelectItem value="image">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5" /> Image
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* English section */}
              <div className="space-y-3">
                <div className="font-semibold text-sm text-navy border-b pb-1">
                  English
                </div>
                {isCurrentQImage ? (
                  <div className="space-y-1.5">
                    <Label>
                      {lang === "en" ? "Question Image (EN)" : "கேள்வி படம் (EN)"}
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "en")}
                    />
                    {imagePreviewEn && (
                      <img
                        src={imagePreviewEn}
                        alt="Preview"
                        className="mt-2 max-h-40 rounded border"
                      />
                    )}
                    {!imagePreviewEn &&
                      editingQuestion.dto.question_image_en?.length > 0 && (
                        <p className="text-sm text-blue-600">
                          📷 Image already uploaded
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>
                      {lang === "en" ? "Question Text (EN)" : "கேள்வி உரை (EN)"}{" "}
                      *
                    </Label>
                    <Input
                      data-ocid="admin.question.en.input"
                      value={editingQuestion.dto.question_text_en}
                      onChange={(e) =>
                        updateQField("question_text_en", e.target.value)
                      }
                      placeholder="Enter question in English"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(["a", "b", "c", "d"] as const).map((opt) => (
                    <div key={opt} className="space-y-1.5">
                      <Label>Option {opt.toUpperCase()} (EN)</Label>
                      <Input
                        data-ocid={`admin.question.opt_${opt}_en.input`}
                        value={
                          editingQuestion.dto[
                            `option_${opt}_en` as keyof QuestionDTO
                          ] as string
                        }
                        onChange={(e) =>
                          updateQField(
                            `option_${opt}_en` as keyof QuestionDTO,
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {lang === "en" ? "Correct Answer (EN)" : "சரியான பதில் (EN)"}{" "}
                    *
                  </Label>
                  <Select
                    value={editingQuestion.dto.correct_answer_en}
                    onValueChange={(v) => updateQField("correct_answer_en", v)}
                  >
                    <SelectTrigger data-ocid="admin.question.correct_en.select">
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["a", "b", "c", "d"] as const).map((opt) => {
                        const val = editingQuestion.dto[
                          `option_${opt}_en` as keyof QuestionDTO
                        ] as string;
                        return val ? (
                          <SelectItem key={opt} value={val}>
                            {opt.toUpperCase()}: {val}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tamil section */}
              <div className="space-y-3">
                <div className="font-semibold text-sm text-navy border-b pb-1">
                  Tamil (தமிழ்)
                </div>
                {isCurrentQImage ? (
                  <div className="space-y-1.5">
                    <Label>
                      {lang === "en"
                        ? "Question Image (தமிழ்)"
                        : "கேள்வி படம் (தமிழ்)"}
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "ta")}
                    />
                    {imagePreviewTa && (
                      <img
                        src={imagePreviewTa}
                        alt="Preview"
                        className="mt-2 max-h-40 rounded border"
                      />
                    )}
                    {!imagePreviewTa &&
                      editingQuestion.dto.question_image_ta?.length > 0 && (
                        <p className="text-sm text-blue-600">
                          📷 Image already uploaded
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>
                      {lang === "en"
                        ? "Question Text (தமிழ்)"
                        : "கேள்வி உரை (தமிழ்)"}
                    </Label>
                    <Input
                      data-ocid="admin.question.ta.input"
                      value={editingQuestion.dto.question_text_ta}
                      onChange={(e) =>
                        updateQField("question_text_ta", e.target.value)
                      }
                      placeholder="கேள்வியை தமிழில் உள்ளிடவும்"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(["a", "b", "c", "d"] as const).map((opt) => (
                    <div key={opt} className="space-y-1.5">
                      <Label>Option {opt.toUpperCase()} (தமிழ்)</Label>
                      <Input
                        value={
                          editingQuestion.dto[
                            `option_${opt}_ta` as keyof QuestionDTO
                          ] as string
                        }
                        onChange={(e) =>
                          updateQField(
                            `option_${opt}_ta` as keyof QuestionDTO,
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {lang === "en"
                      ? "Correct Answer (தமிழ்)"
                      : "சரியான பதில் (தமிழ்)"}
                  </Label>
                  <Select
                    value={editingQuestion.dto.correct_answer_ta}
                    onValueChange={(v) => updateQField("correct_answer_ta", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["a", "b", "c", "d"] as const).map((opt) => {
                        const val = editingQuestion.dto[
                          `option_${opt}_ta` as keyof QuestionDTO
                        ] as string;
                        return val ? (
                          <SelectItem key={opt} value={val}>
                            {opt.toUpperCase()}: {val}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              data-ocid="admin.question.cancel_button"
              variant="outline"
              onClick={() => {
                setQDialogOpen(false);
                setEditingQuestion(null);
                setImagePreviewEn(null);
                setImagePreviewTa(null);
              }}
            >
              {lang === "en" ? "Cancel" : "ரத்து"}
            </Button>
            <Button
              data-ocid="admin.question.save_button"
              className="bg-gold text-navy font-bold hover:bg-gold/90"
              onClick={handleSaveQuestion}
              disabled={savingQ}
            >
              {savingQ ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : lang === "en" ? (
                "Save Question"
              ) : (
                "சேமி"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
