import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";
import { type QuestionDTO, QuestionType } from "../backend.d";

interface ExamPageProps {
  setPage: (p: Page) => void;
  lang: Lang;
  goToResults: (id: bigint) => void;
  initialRegId?: bigint | null;
  initialTestKey?: string | null;
}

const EXAM_DURATION = 30 * 60;
const QUESTIONS_PER_PAGE = 5;

const tx = {
  en: {
    title: "MKJC Scholarship Exam",
    loading: "Loading questions…",
    question: "Question",
    of: "of",
    previous: "Previous",
    next: "Next",
    submit: "Submit Exam",
    submitting: "Submitting…",
    timeUp: "Time is up! Submitting your answers…",
    page: "Page",
    answered: "Answered",
    unanswered: "Not answered",
    confirmTitle: "Submit Exam?",
    confirmDesc: (n: number) =>
      n === 0
        ? "All questions are answered. Submit now?"
        : `You have ${n} unanswered question(s). Submit anyway?`,
    confirmYes: "Yes, Submit",
    confirmNo: "Go Back",
    gridLabel: "Question Navigator",
    legend: {
      answered: "Answered",
      unanswered: "Unanswered",
      current: "Current page",
    },
  },
  ta: {
    title: "MKJC உதவித்தொகை தேர்வு",
    loading: "கேள்விகள் ஏற்றப்படுகின்றன…",
    question: "கேள்வி",
    of: "இல்",
    previous: "முந்தைய",
    next: "அடுத்த",
    submit: "தேர்வை சமர்ப்பிக்கவும்",
    submitting: "சமர்ப்பிக்கிறது…",
    timeUp: "நேரம் முடிந்தது! உங்கள் பதில்கள் சமர்ப்பிக்கப்படுகின்றன…",
    page: "பக்கம்",
    answered: "பதிலளிக்கப்பட்டது",
    unanswered: "பதிலளிக்கப்படவில்லை",
    confirmTitle: "தேர்வை சமர்ப்பிக்கவா?",
    confirmDesc: (n: number) =>
      n === 0
        ? "அனைத்து கேள்விகளுக்கும் பதில் அளிக்கப்பட்டது. இப்போது சமர்ப்பிக்கவா?"
        : `${n} கேள்விகளுக்கு பதில் இல்லை. சமர்ப்பிக்கவா?`,
    confirmYes: "ஆம், சமர்ப்பிக்கவும்",
    confirmNo: "திரும்பு",
    gridLabel: "கேள்வி வழிகாட்டி",
    legend: {
      answered: "பதிலளிக்கப்பட்டது",
      unanswered: "பதிலளிக்கப்படவில்லை",
      current: "தற்போதைய பக்கம்",
    },
  },
} as const;

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function imageBytes(bytes: Uint8Array): string | null {
  if (!bytes || bytes.length === 0) return null;
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return `data:image/png;base64,${btoa(binary)}`;
}

export default function ExamPage({
  lang,
  goToResults,
  initialRegId,
  initialTestKey,
}: ExamPageProps) {
  const labels = tx[lang];
  const { actor } = useActor(createActor);

  const [regId] = useState<bigint | null>(initialRegId ?? null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizLang, setQuizLang] = useState<Lang>(lang);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Load questions on mount
  useEffect(() => {
    if (!actor || !initialTestKey) return;
    actor
      .listQuestions(initialTestKey, true)
      .then((qs) => {
        if (!qs.length) {
          toast.error(
            lang === "en"
              ? "No questions found for this test."
              : "தேர்வுக்கு கேள்விகள் இல்லை.",
          );
          return;
        }
        setQuestions(
          qs.sort((a, b) => Number(a.question_order - b.question_order)),
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error(
          lang === "en" ? "Failed to load questions." : "கேள்விகள் ஏற்றம் தோல்வி.",
        );
      })
      .finally(() => setLoadingQ(false));
  }, [actor, initialTestKey, lang]);

  const handleSubmitExam = useCallback(
    async (forceAnswers?: Record<number, string>) => {
      if (!actor || !regId) return;
      const finalAnswers = forceAnswers ?? answers;
      setSubmitting(true);
      setShowConfirm(false);
      try {
        const totalQ = questions.length;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        let correctCount = 0;
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const studentAnswer = finalAnswers[i] ?? "";
          const correctAnswer = q.correct_answer_en;
          const isCorrect = studentAnswer === correctAnswer;
          if (isCorrect) correctCount++;
          const percentage = (correctCount / totalQ) * 100;
          await actor.submitQuizResponse(
            regId,
            BigInt(i + 1),
            q.question_text_en,
            studentAnswer,
            correctAnswer,
            isCorrect,
            BigInt(isCorrect ? 1 : 0),
            BigInt(totalQ),
            percentage,
            BigInt(elapsedSeconds),
          );
        }
        toast.success(
          lang === "en" ? "Exam submitted!" : "தேர்வு சமர்ப்பிக்கப்பட்டது!",
        );
        goToResults(regId);
      } catch (err) {
        console.error(err);
        toast.error(
          lang === "en"
            ? "Submission failed. Please try again."
            : "சமர்ப்பிப்பு தோல்வி.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [actor, regId, questions, answers, startTime, lang, goToResults],
  );

  // Countdown timer
  useEffect(() => {
    if (loadingQ || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.warning(labels.timeUp);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loadingQ, questions.length, handleSubmitExam, labels.timeUp]);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageStart = currentPage * QUESTIONS_PER_PAGE;
  const pageEnd = Math.min(pageStart + QUESTIONS_PER_PAGE, questions.length);
  const pageQuestions = questions.slice(pageStart, pageEnd);
  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isLastPage = currentPage === totalPages - 1;
  const unansweredCount = questions.length - answeredCount;

  const getQuestionData = useCallback(
    (q: QuestionDTO) => ({
      text: quizLang === "ta" ? q.question_text_ta : q.question_text_en,
      imageBytes: quizLang === "ta" ? q.question_image_ta : q.question_image_en,
      isImage: q.question_type === QuestionType.image,
      options: [
        {
          label: "A",
          display: quizLang === "ta" ? q.option_a_ta : q.option_a_en,
          value: q.option_a_en,
        },
        {
          label: "B",
          display: quizLang === "ta" ? q.option_b_ta : q.option_b_en,
          value: q.option_b_en,
        },
        {
          label: "C",
          display: quizLang === "ta" ? q.option_c_ta : q.option_c_en,
          value: q.option_c_en,
        },
        {
          label: "D",
          display: quizLang === "ta" ? q.option_d_ta : q.option_d_en,
          value: q.option_d_en,
        },
      ],
    }),
    [quizLang],
  );

  // Memoize image data src to avoid recomputation
  const imageSrcs = useMemo(
    () =>
      pageQuestions.map((q) => {
        const bytes =
          quizLang === "ta" ? q.question_image_ta : q.question_image_en;
        return imageBytes(bytes);
      }),
    [pageQuestions, quizLang],
  );

  if (loadingQ) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-ocid="exam.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-secondary" />
          <p className="text-secondary font-semibold">{labels.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4" data-ocid="exam.page">
      <div className="max-w-3xl mx-auto">
        {/* ── Header card ── */}
        <div className="bg-card rounded-2xl shadow-subtle border border-border p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="font-bold text-secondary text-lg truncate min-w-0">
            {labels.title}
          </h1>

          {/* Language toggle */}
          <fieldset
            className="flex items-center border-2 border-secondary rounded-full overflow-hidden text-sm font-semibold flex-shrink-0"
            aria-label="Language toggle"
            data-ocid="exam.language.toggle"
          >
            <button
              type="button"
              onClick={() => setQuizLang("en")}
              aria-pressed={quizLang === "en"}
              className={`px-4 py-1.5 transition-smooth ${
                quizLang === "en"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-secondary hover:bg-secondary/10"
              }`}
              data-ocid="exam.language.en"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setQuizLang("ta")}
              aria-pressed={quizLang === "ta"}
              className={`px-4 py-1.5 transition-smooth ${
                quizLang === "ta"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-secondary hover:bg-secondary/10"
              }`}
              data-ocid="exam.language.ta"
            >
              தமிழ்
            </button>
          </fieldset>
          <div
            className={`flex items-center gap-2 font-bold text-lg px-4 py-1.5 rounded-full flex-shrink-0 transition-smooth ${
              timeLeft < 300
                ? "bg-destructive/10 text-destructive"
                : "bg-secondary/10 text-secondary"
            }`}
            aria-live="polite"
            aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            data-ocid="exam.timer"
          >
            <Clock className="h-5 w-5" />
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>
            {labels.page} {currentPage + 1} / {totalPages}
          </span>
          <span>
            {labels.answered}: {answeredCount} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="mb-6 h-2.5 rounded-full" />

        {/* ── Questions ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            {pageQuestions.map((q, pageIdx) => {
              const globalIdx = pageStart + pageIdx;
              const qData = getQuestionData(q);
              const imgSrc = imageSrcs[pageIdx];
              const isAnswered = answers[globalIdx] !== undefined;

              return (
                <div
                  key={`q-${globalIdx}`}
                  className={`bg-card rounded-2xl border transition-smooth p-6 ${
                    isAnswered
                      ? "border-secondary/30 shadow-subtle"
                      : "border-border shadow-subtle"
                  }`}
                  data-ocid={`exam.question.${globalIdx + 1}`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-5">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center">
                      {globalIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-card-foreground font-semibold leading-relaxed text-base break-words ${quizLang === "ta" ? "font-['Noto_Sans_Tamil']" : ""}`}
                      >
                        {qData.text}
                      </p>
                      {/* Image for image-type questions */}
                      {qData.isImage && imgSrc && (
                        <img
                          src={imgSrc}
                          alt={`Visual content for question ${globalIdx + 1}`}
                          className="mt-3 max-w-full rounded-lg border border-border object-contain max-h-56"
                        />
                      )}
                    </div>
                  </div>

                  {/* Options A B C D */}
                  <fieldset className="grid grid-cols-1 gap-3">
                    <legend className="sr-only">
                      Question {globalIdx + 1} options
                    </legend>
                    {qData.options.map((opt) => {
                      const selected = answers[globalIdx] === opt.value;
                      const inputId = `q${globalIdx}-opt-${opt.label}`;
                      return (
                        <label
                          key={opt.value}
                          htmlFor={inputId}
                          className={`w-full cursor-pointer px-4 py-3 rounded-xl border-2 transition-smooth font-medium flex items-center gap-3 ${
                            selected
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-border hover:border-secondary/40 text-card-foreground hover:bg-muted"
                          }`}
                          data-ocid={`exam.option.${globalIdx + 1}.${opt.label.toLowerCase()}`}
                        >
                          <input
                            type="radio"
                            id={inputId}
                            name={`question-${globalIdx}`}
                            value={opt.value}
                            checked={selected}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [globalIdx]: opt.value,
                              }))
                            }
                            className="sr-only"
                          />
                          <span
                            className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-smooth ${
                              selected
                                ? "border-secondary bg-secondary text-secondary-foreground"
                                : "border-muted-foreground text-muted-foreground"
                            }`}
                            aria-hidden="true"
                          >
                            {opt.label}
                          </span>
                          <span
                            className={`${quizLang === "ta" ? "font-['Noto_Sans_Tamil']" : ""} break-words min-w-0`}
                          >
                            {opt.display}
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-8 gap-3">
          <Button
            variant="outline"
            className="border-2 border-secondary text-secondary hover:bg-secondary/5 rounded-xl px-6 h-11 font-semibold"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
            data-ocid="exam.pagination_prev"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {labels.previous}
          </Button>

          <span className="text-sm text-muted-foreground font-medium hidden sm:block">
            {pageStart + 1}–{pageEnd} {labels.of} {questions.length}
          </span>

          {isLastPage ? (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 h-11 font-bold"
              disabled={submitting}
              onClick={() => setShowConfirm(true)}
              data-ocid="exam.submit_button"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {labels.submitting}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {labels.submit}
                </>
              )}
            </Button>
          ) : (
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl px-6 h-11 font-semibold"
              onClick={() => setCurrentPage((p) => p + 1)}
              data-ocid="exam.pagination_next"
            >
              {labels.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* ── Question navigator grid ── */}
        <div className="mt-8 bg-card border border-border rounded-2xl p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-card-foreground">
              {labels.gridLabel}
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                {labels.legend.answered}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-muted inline-block border border-border" />
                {labels.legend.unanswered}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-secondary inline-block" />
                {labels.legend.current}
              </span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label={labels.gridLabel}>
            {questions.map((q, i) => {
              const pageOfThis = Math.floor(i / QUESTIONS_PER_PAGE);
              const isCurrent = pageOfThis === currentPage;
              const isAns = answers[i] !== undefined;
              return (
                <button
                  type="button"
                  key={`qnav-${Number(q.question_order)}`}
                  onClick={() => setCurrentPage(pageOfThis)}
                  aria-label={`Question ${i + 1}${isAns ? " (answered)" : ""}`}
                  aria-current={isCurrent ? "true" : undefined}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-smooth focus-visible:outline-2 focus-visible:outline-ring ${
                    isCurrent
                      ? "bg-secondary text-secondary-foreground scale-110 shadow-md"
                      : isAns
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                  }`}
                  data-ocid={`exam.grid.item.${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Submit confirmation dialog ── */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent data-ocid="exam.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.confirmDesc(unansweredCount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="exam.cancel_button">
              {labels.confirmNo}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleSubmitExam()}
              data-ocid="exam.confirm_button"
            >
              {labels.confirmYes}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
