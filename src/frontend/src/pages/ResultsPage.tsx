import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, Trophy, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import type { QuizResponse } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface ResultsPageProps {
  regId: bigint | null;
  setPage: (p: Page) => void;
  lang: Lang;
}

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
    detailedResults: "Detailed Results",
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
    detailedResults: "விரிவான முடிவுகள்",
  },
};

function formatSeconds(secs: bigint) {
  const s = Number(secs);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function ResultsPage({
  regId: initialRegId,
  setPage,
  lang,
}: ResultsPageProps) {
  const tx = t[lang];
  const { actor } = useActor();
  const [regIdInput, setRegIdInput] = useState(
    initialRegId ? initialRegId.toString() : "",
  );
  const [responses, setResponses] = useState<QuizResponse[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    if (!actor) {
      toast.error("Backend not ready");
      return;
    }
    const id = BigInt(regIdInput.trim());
    setLoading(true);
    try {
      const data = await actor.getResponsesByRegistrationId(id);
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
  const pct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const timeTaken =
    responses && responses.length > 0 ? responses[0].time_taken : 0n;

  if (responses === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg shadow-card p-8 max-w-md w-full"
        >
          <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-navy mb-2">
            {tx.title}
          </h1>
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

  if (responses.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div
          className="bg-card rounded-lg shadow-card p-8 max-w-md w-full text-center"
          data-ocid="results.empty_state"
        >
          <p className="text-muted-foreground mb-4">{tx.noResults}</p>
          <Button
            data-ocid="results.retry.button"
            onClick={() => setPage("exam")}
            variant="outline"
          >
            {tx.tryAgain}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg shadow-card p-8 mb-6"
          data-ocid="results.summary.card"
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-gold" />
            <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-navy">
              {tx.title}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-navy">
                {correctCount}/{totalQ}
              </div>
              <div className="text-sm text-muted-foreground">{tx.score}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-gold">
                {pct}%
              </div>
              <div className="text-sm text-muted-foreground">
                {tx.percentage}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-navy">
                {correctCount}
              </div>
              <div className="text-sm text-muted-foreground">{tx.correct}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold text-destructive">
                {totalQ - correctCount}
              </div>
              <div className="text-sm text-muted-foreground">
                {tx.incorrect}
              </div>
            </div>
          </div>

          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">{tx.percentage}</span>
            <span className="font-bold text-navy">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3 mb-4" />
          <p className="text-sm text-muted-foreground">
            {tx.timeTaken}: {formatSeconds(timeTaken)}
          </p>
        </motion.div>

        <h2 className="font-display font-bold text-xl text-navy mb-4 uppercase tracking-wider">
          {tx.detailedResults}
        </h2>
        <div className="space-y-4">
          {responses.map((r, i) => (
            <motion.div
              key={`response-${r.id.toString()}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-lg shadow-card p-5"
              data-ocid={`results.item.${i + 1}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-navy mb-2">
                    <span className="text-muted-foreground text-sm mr-2">
                      Q{i + 1}.
                    </span>
                    {r.question_text}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {tx.yourAnswer}:{" "}
                      <span
                        className={
                          r.is_correct
                            ? "text-green-600 font-medium"
                            : "text-destructive font-medium"
                        }
                      >
                        {r.student_answer || "-"}
                      </span>
                    </span>
                    {!r.is_correct && (
                      <span className="text-muted-foreground">
                        {tx.correctAnswer}:{" "}
                        <span className="text-green-600 font-medium">
                          {r.correct_answer}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                {r.is_correct ? (
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex gap-3 flex-wrap">
          <Button
            data-ocid="results.retry.button"
            variant="outline"
            onClick={() => setPage("exam")}
          >
            {tx.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}
