import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@caffeineai/core-infrastructure";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";

interface StudentLoginPageProps {
  startExam: (regId: bigint, testKey: string) => void;
  setPage: (p: Page) => void;
  lang: Lang;
}

export default function StudentLoginPage({
  startExam,
  setPage,
  lang,
}: StudentLoginPageProps) {
  const { actor } = useActor(createActor);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!actor) {
      setError(
        lang === "en"
          ? "Backend not ready. Please try again."
          : "பின்தளம் தயாராக இல்லை. மீண்டும் முயற்சிக்கவும்.",
      );
      return;
    }
    if (!userId.trim() || !password.trim()) {
      setError(
        lang === "en"
          ? "Please enter your User ID and Password."
          : "பயனர் ID மற்றும் கடவுச்சொல் உள்ளிடவும்.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await actor.validateStudentLogin(
        userId.trim(),
        password.trim(),
      );
      toast.success(
        lang === "en"
          ? "Login successful! Starting exam…"
          : "உள்நுழைவு வெற்றிகரமானது!",
      );
      startExam(result.registration_id, result.test_key);
    } catch {
      setError(
        lang === "en"
          ? "Invalid User ID or Password. Please check and try again."
          : "தவறான பயனர் ID அல்லது கடவுச்சொல். சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4 py-10">
      {/* Card */}
      <div className="bg-card rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Navy header strip */}
        <div className="bg-secondary px-8 py-7 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-bold text-xl text-secondary-foreground tracking-wide uppercase">
            MKJC Scholarship Portal
          </h1>
          <p className="text-primary text-sm font-medium mt-1">
            {lang === "en" ? "Student Exam Login" : "மாணவர் தேர்வு உள்நுழைவு"}
          </p>
        </div>

        {/* Form body */}
        <div className="px-8 py-7">
          {/* Info banner */}
          <div className="bg-muted border border-border rounded-xl p-3 mb-6 text-sm text-muted-foreground leading-relaxed">
            {lang === "en"
              ? "Use the User ID and Password sent to your registered mobile number via SMS."
              : "உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண்ணுக்கு SMS வழி அனுப்பப்பட்ட பயனர் ID மற்றும் கடவுச்சொல்லை பயன்படுத்தவும்."}
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* User ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="student-user-id"
                className="text-sm font-semibold text-foreground"
              >
                {lang === "en" ? "User ID" : "பயனர் ID"}
              </label>
              <Input
                id="student-user-id"
                data-ocid="student_login.user_id.input"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. STU001001"
                className="h-12 rounded-xl font-mono tracking-widest text-base"
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="student-password"
                className="text-sm font-semibold text-foreground"
              >
                {lang === "en" ? "Password" : "கடவுச்சொல்"}
              </label>
              <div className="relative">
                <Input
                  id="student-password"
                  data-ocid="student_login.password.input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder={
                    lang === "en" ? "Enter your password" : "கடவுச்சொல் உள்ளிடவும்"
                  }
                  className="h-12 rounded-xl pr-12 font-mono tracking-widest text-base"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  data-ocid="student_login.toggle_password.button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <div
                data-ocid="student_login.error_state"
                className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive font-medium"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              data-ocid="student_login.submit.button"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base tracking-wide transition-smooth mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {lang === "en" ? "Logging in…" : "உள்நுழைகிறது…"}
                </>
              ) : lang === "en" ? (
                "Login & Start Exam"
              ) : (
                "உள்நுழைந்து தேர்வு தொடங்கவும்"
              )}
            </Button>
          </form>

          {/* Back link */}
          <div className="text-center mt-6">
            <button
              type="button"
              data-ocid="student_login.back.link"
              className="text-sm text-accent hover:text-accent/80 hover:underline font-medium transition-colors duration-200"
              onClick={() => setPage("home")}
            >
              {lang === "en" ? "← Back to Registration" : "← பதிவுக்கு திரும்பு"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
