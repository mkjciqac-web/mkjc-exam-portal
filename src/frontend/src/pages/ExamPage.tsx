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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";
import type { QuestionDTO } from "../backend.d";

interface ExamPageProps {
  setPage: (p: Page) => void;
  lang: Lang;
  goToResults: (id: bigint) => void;
  initialRegId?: bigint | null;
  initialTestKey?: string | null;
}

const EXAM_DURATION = 30 * 60;
const QUESTIONS_PER_PAGE = 5;

const t = {
  en: {
    title: "MKJC Scholarship Exam",
    loading: "Loading questions...",
    question: "Question",
    of: "of",
    previous: "Previous",
    next: "Next",
    submit: "Submit Exam",
    submitting: "Submitting...",
    timeUp: "Time is up! Submitting your answers...",
    page: "Page",
    answered: "Answered",
    unanswered: "Not answered",
    confirmSubmit: "Are you sure you want to submit the exam?",
  },
  ta: {
    title: "MKJC உதவித்தொகை தேர்வு",
    loading: "கேள்விகள் ஏற்றப்படுகின்றன...",
    question: "கேள்வி",
    of: "இல்",
    previous: "முந்தைய",
    next: "அடுத்த",
    submit: "தேர்வை சமர்ப்பிக்கவும்",
    submitting: "சமர்ப்பிக்கிறது...",
    timeUp: "நேரம் முடிந்தது! உங்கள் பதில்கள் சமர்ப்பிக்கப்படுகின்றன...",
    page: "பக்கம்",
    answered: "பதிலளிக்கப்பட்டது",
    unanswered: "பதிலளிக்கப்படவில்லை",
    confirmSubmit: "தேர்வை சமர்ப்பிக்க விரும்புகிறீர்களா?",
  },
};

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function ExamPage({
  lang,
  goToResults,
  initialRegId,
  initialTestKey,
}: ExamPageProps) {
  const tx = t[lang];
  const { actor } = useActor(createActor);
  const [regId] = useState<bigint | null>(initialRegId ?? null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizLang, setQuizLang] = useState<Lang>(lang);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // Load questions on mount
  useEffect(() => {
    if (!actor || !initialTestKey) return;
    actor
      .getQuestionsByTestKey(initialTestKey, true)
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

  useEffect(() => {
    if (loadingQ || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.warning(tx.timeUp);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loadingQ, questions.length, handleSubmitExam, tx.timeUp]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function getQuestionData(q: QuestionDTO) {
    return {
      text: quizLang === "ta" ? q.question_text_ta : q.question_text_en,
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
    };
  }

  if (loadingQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#4c5ddb]" />
          <p className="text-[#4c5ddb] font-semibold">{tx.loading}</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageStart = currentPage * QUESTIONS_PER_PAGE;
  const pageEnd = Math.min(pageStart + QUESTIONS_PER_PAGE, questions.length);
  const pageQuestions = questions.slice(pageStart, pageEnd);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isLastPage = currentPage === totalPages - 1;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="font-bold text-[#3d4fcc] text-lg">{tx.title}</h1>

          {/* Language toggle */}
          <div className="flex items-center border-2 border-[#4c5ddb] rounded-full overflow-hidden text-sm font-semibold">
            <button
              type="button"
              onClick={() => setQuizLang("en")}
              className={`px-4 py-1.5 transition-colors ${
                quizLang === "en"
                  ? "bg-[#4c5ddb] text-white"
                  : "text-[#4c5ddb] hover:bg-[#4c5ddb]/10"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setQuizLang("ta")}
              className={`px-4 py-1.5 transition-colors ${
                quizLang === "ta"
                  ? "bg-[#4c5ddb] text-white"
                  : "text-[#4c5ddb] hover:bg-[#4c5ddb]/10"
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 font-bold text-lg px-4 py-1.5 rounded-full ${
              timeLeft < 300
                ? "bg-red-100 text-red-600"
                : "bg-[#4c5ddb]/10 text-[#4c5ddb]"
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 flex items-center justify-between text-sm font-medium text-gray-600">
          <span>
            {tx.page} {currentPage + 1} / {totalPages}
          </span>
          <span>
            {tx.answered}: {answeredCount} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="mb-6 h-2.5 rounded-full" />

        {/* Questions on this page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {pageQuestions.map((q, pageIdx) => {
              const globalIdx = pageStart + pageIdx;
              const qData = getQuestionData(q);
              return (
                <div
                  key={`q-${globalIdx}`}
                  className="bg-white rounded-2xl shadow-md p-6"
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-5">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4c5ddb] text-white text-sm font-bold flex items-center justify-center">
                      {globalIdx + 1}
                    </span>
                    <p className="text-gray-800 font-semibold leading-relaxed text-base">
                      {qData.text}
                    </p>
                  </div>

                  {/* Options A B C D */}
                  <div className="grid grid-cols-1 gap-3">
                    {qData.options.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [globalIdx]: opt.value,
                          }))
                        }
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium flex items-center gap-3 ${
                          answers[globalIdx] === opt.value
                            ? "border-[#4c5ddb] bg-[#4c5ddb]/10 text-[#3d4fcc]"
                            : "border-gray-200 hover:border-[#4c5ddb]/40 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                            answers[globalIdx] === opt.value
                              ? "border-[#4c5ddb] bg-[#4c5ddb] text-white"
                              : "border-gray-400 text-gray-500"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span>{opt.display}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            className="border-2 border-[#4c5ddb] text-[#4c5ddb] hover:bg-[#4c5ddb]/5 rounded-xl px-6 h-11 font-semibold"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {tx.previous}
          </Button>

          <span className="text-sm text-gray-500 font-medium hidden sm:block">
            {OPTION_LABELS && null}
            {pageStart + 1}–{pageEnd} of {questions.length}
          </span>

          {isLastPage ? (
            <Button
              className="bg-[#4c5ddb] hover:bg-[#3d4fcc] text-white rounded-xl px-6 h-11 font-bold"
              disabled={submitting}
              onClick={() => {
                if (!allAnswered) {
                  const unanswered = questions.length - answeredCount;
                  const msg =
                    lang === "en"
                      ? `You have ${unanswered} unanswered question(s). Submit anyway?`
                      : `${unanswered} கேள்விகளுக்கு பதில் இல்லை. சமர்ப்பிக்கவா?`;
                  if (!confirm(msg)) return;
                }
                handleSubmitExam();
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tx.submitting}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {tx.submit}
                </>
              )}
            </Button>
          ) : (
            <Button
              className="bg-[#4c5ddb] hover:bg-[#3d4fcc] text-white rounded-xl px-6 h-11 font-semibold"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {tx.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question number grid */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {questions.map((q, i) => {
            const pageOfThis = Math.floor(i / QUESTIONS_PER_PAGE);
            const isCurrent = pageOfThis === currentPage;
            return (
              <button
                type="button"
                key={`qnav-${Number(q.question_order)}`}
                onClick={() => setCurrentPage(pageOfThis)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                  isCurrent
                    ? "bg-[#4c5ddb] text-white"
                    : answers[i] !== undefined
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
                title={`Q${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
