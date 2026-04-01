import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPage from "./pages/AdminPage";
import ExamPage from "./pages/ExamPage";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";

export type Page = "home" | "exam" | "results" | "admin";
export type Lang = "en" | "ta";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [lang] = useState<Lang>("en");
  const [resultRegId, setResultRegId] = useState<bigint | null>(null);
  const [examRegId, setExamRegId] = useState<bigint | null>(null);
  const [examTestKey, setExamTestKey] = useState<string | null>(null);

  function goToResults(regId: bigint) {
    setResultRegId(regId);
    setPage("results");
  }

  function startExam(regId: bigint, testKey: string) {
    setExamRegId(regId);
    setExamTestKey(testKey);
    setPage("exam");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {page === "home" && (
          <HomePage startExam={startExam} setPage={setPage} lang={lang} />
        )}
        {page === "exam" && (
          <ExamPage
            setPage={setPage}
            lang={lang}
            goToResults={goToResults}
            initialRegId={examRegId}
            initialTestKey={examTestKey}
          />
        )}
        {page === "results" && (
          <ResultsPage regId={resultRegId} setPage={setPage} lang={lang} />
        )}
        {page === "admin" && <AdminPage lang={lang} />}
      </main>
      <Toaster richColors />
    </div>
  );
}
