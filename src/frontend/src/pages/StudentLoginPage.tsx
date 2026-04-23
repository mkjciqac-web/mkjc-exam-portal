import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@caffeineai/core-infrastructure";
import { Eye, EyeOff, Loader2, UserCircle } from "lucide-react";
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) {
      toast.error(lang === "en" ? "Backend not ready" : "பின்தளம் தயாராக இல்லை");
      return;
    }
    if (!userId.trim() || !password.trim()) {
      toast.error(
        lang === "en"
          ? "Please enter User ID and Password"
          : "பயனர் ID மற்றும் கடவுச்சொல் உள்ளிடவும்",
      );
      return;
    }
    setLoading(true);
    try {
      // Cast to any since backend.ts is auto-generated and may not
      // include these newer methods in its typed interface yet
      const result = (await (actor as any).validateStudentLogin(
        userId.trim(),
        password.trim(),
      )) as { registration_id: bigint; test_key: string };
      toast.success(
        lang === "en"
          ? "Login successful! Starting exam..."
          : "உள்நுழைவு வெற்றிகரமானது!",
      );
      startExam(result.registration_id, result.test_key);
    } catch (err) {
      console.error(err);
      toast.error(
        lang === "en"
          ? "Invalid User ID or Password"
          : "தவறான பயனர் ID அல்லது கடவுச்சொல்",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4c5ddb] rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="h-9 w-9 text-white" />
          </div>
          <h1 className="font-bold text-2xl text-[#3d4fcc]">
            {lang === "en" ? "Student Login" : "மாணவர் உள்நுழைவு"}
          </h1>
          {lang === "en" && (
            <p className="text-sm text-gray-500 mt-1">மாணவர் உள்நுழைவு</p>
          )}
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-sm text-blue-700">
          {lang === "en"
            ? "Use the User ID and Password sent to your registered mobile number."
            : "உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண்ணுக்கு அனுப்பப்பட்ட பயனர் ID மற்றும் கடவுச்சொல்லை பயன்படுத்தவும்."}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* User ID */}
          <div className="space-y-1">
            <label
              htmlFor="student-user-id"
              className="text-sm font-semibold text-gray-700"
            >
              {lang === "en" ? "User ID" : "பயனர் ID"}
            </label>
            <Input
              id="student-user-id"
              data-ocid="student_login.user_id.input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. STU001001"
              className="rounded-xl border-gray-200 h-12 font-mono tracking-wider"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="student-password"
              className="text-sm font-semibold text-gray-700"
            >
              {lang === "en" ? "Password" : "கடவுச்சொல்"}
            </label>
            <div className="relative">
              <Input
                id="student-password"
                data-ocid="student_login.password.input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  lang === "en" ? "Enter your password" : "கடவுச்சொல் உள்ளிடவும்"
                }
                className="rounded-xl border-gray-200 h-12 pr-12 font-mono tracking-wider"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                data-ocid="student_login.toggle_password.button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
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

          {/* Login button */}
          <Button
            type="submit"
            data-ocid="student_login.submit.button"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#4c5ddb] hover:bg-[#3d4fcc] text-white font-bold text-base mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lang === "en" ? "Logging in..." : "உள்நுழைகிறது..."}
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
            className="text-sm text-[#4c5ddb] hover:text-[#3d4fcc] hover:underline font-medium"
            onClick={() => setPage("home")}
          >
            {lang === "en" ? "← Back to Registration" : "← பதிவுக்கு திரும்பு"}
          </button>
        </div>
      </div>
    </div>
  );
}
