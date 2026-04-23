import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Trophy,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";
import type { QuizResponse } from "../backend.d";

interface ResultsPageProps {
  regId: bigint | null;
  setPage: (p: Page) => void;
  lang: Lang;
}

const PASS_THRESHOLD = 50;

const t = {
  en: {
    title: "EXAM RESULTS",
    enterRegId: "Enter your Registration ID to view results",
    regIdLabel: "Registration ID",
    viewResults: "View Results",
    loading: "Loading results...",
    score: "Score",
    percentage: "Percentage",
    timeTaken: "Time Taken",
    correct: "Correct",
    incorrect: "Incorrect",
    noResults: "No results found for this Registration ID.",
    tryAgain: "Try Again",
    yourAnswer: "Your Answer",
    correctAnswer: "Correct Answer",
    detailedResults: "Detailed Question Review",
    showDetails: "Show Details",
    hideDetails: "Hide Details",
    startOver: "Start Over",
    pass: "PASS",
    fail: "FAIL",
    passMsg: "Congratulations! You have passed the exam.",
    failMsg: "You did not meet the passing threshold. Keep practicing!",
    minutes: "min",
    seconds: "sec",
  },
  ta: {
    title: "தேர்வு முடிவுகள்",
    enterRegId: "முடிவுகளை பார்க்க உங்கள் பதிவு ID ஐ உள்ளிடுங்கள்",
    regIdLabel: "பதிவு ID",
    viewResults: "முடிவுகளை பாருங்கள்",
    loading: "முடிவுகள் ஏற்றப்படுகின்றன...",
    score: "மதிப்பெண்",
    percentage: "சதவீதம்",
    timeTaken: "எடுத்த நேரம்",
    correct: "சரியான",
    incorrect: "தவறான",
    noResults: "இந்த பதிவு ID க்கு முடிவுகள் இல்லை.",
    tryAgain: "மீண்டும் முயற்சிக்கவும்",
    yourAnswer: "உங்கள் பதில்",
    correctAnswer: "சரியான பதில்",
    detailedResults: "விரிவான கேள்வி மதிப்பாய்வு",
    showDetails: "விவரங்களைக் காட்டு",
    hideDetails: "விவரங்களை மறை",
    startOver: "மீண்டும் தொடங்கு",
    pass: "தேர்ச்சி",
    fail: "தோல்வி",
    passMsg: "வாழ்த்துகள்! நீங்கள் தேர்வில் தேர்ச்சி பெற்றீர்கள்.",
    failMsg: "நீங்கள் தேர்ச்சி நிலையை அடையவில்லை. தொடர்ந்து பயிற்சி செய்யுங்கள்!",
    minutes: "நிமி",
    seconds: "வி",
  },
};

function formatSeconds(secs: bigint) {
  const s = Number(secs);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return { m, sec };
}

export default function ResultsPage({
  regId: initialRegId,
  setPage,
  lang,
}: ResultsPageProps) {
  const tx = t[lang];
  const { actor } = useActor(createActor);
  const [regIdInput, setRegIdInput] = useState(
    initialRegId ? initialRegId.toString() : "",
  );
  const [responses, setResponses] = useState<QuizResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function handleFetch() {
    if (!actor) {
      toast.error("Backend not ready");
      return;
    }
    const id = BigInt(regIdInput.trim());
    setLoading(true);
    try {
      const data = await actor.filterQuizResponses(id);
      setResponses(data.length ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(
        lang === "en" ? "Failed to load results." : "முடிவுகள் ஏற்றம் தோல்வி.",
      );
    } finally {
      setLoading(false);
    }
  }

  const totalQ = responses?.length ?? 0;
  const correctCount = responses?.filter((r) => r.is_correct).length ?? 0;
  const incorrectCount = totalQ - correctCount;
  const pct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const passed = pct >= PASS_THRESHOLD;
  const timeTaken =
    responses && responses.length > 0 ? responses[0].time_taken : 0n;
  const { m: mins, sec: secs } = formatSeconds(timeTaken);

  /* ──────────────── Registration ID Entry ──────────────── */
  if (responses === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg shadow-card p-8 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-7 w-7 text-gold" />
            <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-navy">
              {tx.title}
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">{tx.enterRegId}</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="resRegId" className="text-navy font-medium">
                {tx.regIdLabel}
              </Label>
              <Input
                id="resRegId"
                data-ocid="results.reg_id.input"
                value={regIdInput}
                onChange={(e) => setRegIdInput(e.target.value)}
                placeholder="e.g. 1"
                type="number"
                min="1"
              />
            </div>
            <Button
              data-ocid="results.view.primary_button"
              className="w-full bg-navy text-white font-bold hover:bg-navy/90"
              size="lg"
              onClick={handleFetch}
              disabled={loading || !regIdInput}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tx.loading}
                </>
              ) : (
                tx.viewResults
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ──────────────── No Results ──────────────── */
  if (responses.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div
          className="bg-card rounded-lg shadow-card p-8 max-w-md w-full text-center"
          data-ocid="results.empty_state"
        >
          <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">{tx.noResults}</p>
          <Button
            data-ocid="results.startover.button"
            onClick={() => setPage("home")}
            className="bg-navy text-white hover:bg-navy/90"
          >
            {tx.startOver}
          </Button>
        </div>
      </div>
    );
  }

  /* ──────────────── Results Summary ──────────────── */
  return (
    <div className="py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-card overflow-hidden"
          data-ocid="results.summary.card"
        >
          {/* Header band */}
          <div className="bg-navy px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-gold" />
              <h1 className="font-display font-bold text-xl uppercase tracking-wider text-white">
                {tx.title}
              </h1>
            </div>
            <Badge
              data-ocid="results.pass_fail.badge"
              className={
                passed
                  ? "bg-emerald-500 text-white font-bold text-sm px-4 py-1 rounded-full"
                  : "bg-destructive text-white font-bold text-sm px-4 py-1 rounded-full"
              }
            >
              {passed ? tx.pass : tx.fail}
            </Badge>
          </div>

          {/* Pass/Fail message */}
          <div
            className={
              passed
                ? "bg-emerald-50 border-b border-emerald-200 px-6 py-3"
                : "bg-red-50 border-b border-red-200 px-6 py-3"
            }
          >
            <p
              className={
                passed
                  ? "text-sm font-medium text-emerald-700"
                  : "text-sm font-medium text-red-700"
              }
            >
              {passed ? tx.passMsg : tx.failMsg}
            </p>
          </div>

          <div className="p-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {/* Score */}
              <div className="bg-muted/40 rounded-lg p-4 text-center">
                <div className="text-3xl font-display font-bold text-navy">
                  {correctCount}/{totalQ}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                  {tx.score}
                </div>
              </div>

              {/* Percentage */}
              <div className="bg-muted/40 rounded-lg p-4 text-center">
                <div className="text-3xl font-display font-bold text-gold">
                  {pct}%
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">
                  {tx.percentage}
                </div>
              </div>

              {/* Correct */}
              <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div className="text-3xl font-display font-bold text-emerald-600">
                    {correctCount}
                  </div>
                </div>
                <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                  {tx.correct}
                </div>
              </div>

              {/* Incorrect */}
              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div className="text-3xl font-display font-bold text-red-600">
                    {incorrectCount}
                  </div>
                </div>
                <div className="text-xs text-red-700 font-medium uppercase tracking-wide">
                  {tx.incorrect}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground font-medium">
                  {tx.percentage}
                </span>
                <span className="font-bold text-navy">{pct}%</span>
              </div>
              <Progress value={pct} className="h-3 rounded-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-navy font-medium">
                  {PASS_THRESHOLD}%{" "}
                  {lang === "en" ? "pass mark" : "தேர்ச்சி மதிப்பெண்"}
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Time taken */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {tx.timeTaken}:{" "}
                <strong className="text-navy">
                  {mins}
                  {tx.minutes} {secs}
                  {tx.seconds}
                </strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Detailed Review Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl shadow-card overflow-hidden"
        >
          <button
            type="button"
            data-ocid="results.details.toggle"
            onClick={() => setDetailsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-gold" />
              <span className="font-display font-bold text-navy uppercase tracking-wider">
                {tx.detailedResults}
              </span>
            </div>
            {detailsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {detailsOpen && (
            <div className="border-t border-border px-6 py-4 space-y-3">
              {responses.map((r, i) => (
                <motion.div
                  key={`response-${r.id.toString()}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-lg p-4 border ${
                    r.is_correct
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                  data-ocid={`results.item.${i + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {r.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy mb-2 text-sm leading-snug">
                        <span className="text-muted-foreground mr-1.5 font-normal">
                          Q{i + 1}.
                        </span>
                        {r.question_text}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span>
                          <span className="text-muted-foreground">
                            {tx.yourAnswer}:{" "}
                          </span>
                          <span
                            className={
                              r.is_correct
                                ? "text-emerald-700 font-semibold"
                                : "text-red-700 font-semibold line-through"
                            }
                          >
                            {r.student_answer || "-"}
                          </span>
                        </span>
                        {!r.is_correct && (
                          <span>
                            <span className="text-muted-foreground">
                              {tx.correctAnswer}:{" "}
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              {r.correct_answer}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3 flex-wrap justify-center"
        >
          <Button
            data-ocid="results.startover.button"
            size="lg"
            className="bg-navy text-white font-bold hover:bg-navy/90 px-8"
            onClick={() => setPage("home")}
          >
            {tx.startOver}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
