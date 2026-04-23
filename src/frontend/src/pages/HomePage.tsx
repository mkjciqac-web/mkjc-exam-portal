import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@caffeineai/core-infrastructure";
import { CheckCircle, ClipboardCopy, Globe, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";
import { type CustomExam, getExams } from "../utils/examsStore";

interface HomePageProps {
  startExam: (regId: bigint, testKey: string) => void;
  setPage: (p: Page) => void;
  lang: Lang;
  setLang?: (l: Lang) => void;
}

const DEFAULT_EXAMS = [
  { label: "Mathematics - Test 1", value: "Test1" },
  { label: "Science - Test 2", value: "Test2" },
  { label: "General Knowledge - Test 3", value: "Test3" },
];

interface Credentials {
  user_id: string;
  password: string;
}

export default function HomePage({ setPage, lang, setLang }: HomePageProps) {
  const { actor } = useActor(createActor);

  const [examTests, setExamTests] = useState<
    { label: string; value: string }[]
  >(() => {
    const custom: CustomExam[] = getExams();
    const customItems = custom.map((e) => ({
      label: e.exam_name,
      value: e.id,
    }));
    return [...DEFAULT_EXAMS, ...customItems];
  });

  useEffect(() => {
    function refresh() {
      const custom: CustomExam[] = getExams();
      const customItems = custom.map((e) => ({
        label: e.exam_name,
        value: e.id,
      }));
      setExamTests([...DEFAULT_EXAMS, ...customItems]);
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const [form, setForm] = useState({
    student_name: "",
    school_name: "",
    exam_group: "",
    contact_number: "",
    whatsapp_number: "",
    test_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) {
      toast.error(lang === "en" ? "Backend not ready" : "பின்தளம் தயாராக இல்லை");
      return;
    }
    if (!form.student_name || !form.test_key) {
      toast.error(
        lang === "en"
          ? "Please fill in required fields"
          : "தேவையான புலங்களை பூர்த்தி செய்யுங்கள்",
      );
      return;
    }
    setLoading(true);
    try {
      const regId = await actor.addRegistration(
        form.student_name,
        form.school_name,
        form.contact_number,
        form.whatsapp_number,
        form.exam_group,
        form.test_key,
      );

      let creds: Credentials = { user_id: "", password: "" };
      try {
        creds = await actor.generateStudentCredentials(
          regId,
          form.contact_number,
        );
      } catch (credErr) {
        console.error("Credentials generation error:", credErr);
        creds = {
          user_id: `STU${String(regId).padStart(6, "0")}`,
          password: "Check SMS",
        };
      }

      setCredentials(creds);
      toast.success(
        lang === "en" ? "Registration Successful!" : "பதிவு வெற்றிகரமானது!",
      );
    } catch (err) {
      console.error(err);
      toast.error(
        lang === "en"
          ? "Registration failed. Please try again."
          : "பதிவு தோல்வியடைந்தது.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCredentials() {
    if (!credentials) return;
    const text = `User ID: ${credentials.user_id}\nPassword: ${credentials.password}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        toast.success(
          lang === "en" ? "Credentials copied!" : "நற்சான்றிதழ்கள் நகலெடுக்கப்பட்டன!",
        );
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error(lang === "en" ? "Failed to copy" : "நகலெடுக்க முடியவில்லை");
      });
  }

  // ── Credentials screen ─────────────────────────────────────────────
  if (credentials) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{
          background:
            "linear-gradient(135deg, #0B2B4B 0%, #163d6a 60%, #1a4a7e 100%)",
        }}
      >
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8 border border-border">
          {/* MKJC header strip */}
          <div
            className="rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
            style={{ background: "linear-gradient(90deg, #0B2B4B, #1a4a7e)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: "#B88D2A", color: "#0B2B4B" }}
            >
              MK
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#B88D2A" }}>
                MKJC Scholarship Exam Portal
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                {lang === "en" ? "Student Registration" : "மாணவர் பதிவு"}
              </p>
            </div>
          </div>

          {/* Success header */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "oklch(0.95 0.05 145)" }}
            >
              <CheckCircle className="h-9 w-9" style={{ color: "#16a34a" }} />
            </div>
            <h2 className="font-bold text-2xl" style={{ color: "#0B2B4B" }}>
              {lang === "en"
                ? "Registration Successful!"
                : "பதிவு வெற்றிகரமானது!"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "en"
                ? "Save your credentials to log in for the exam"
                : "தேர்வுக்கு உள்நுழைய உங்கள் நற்சான்றிதழ்களை சேமிக்கவும்"}
            </p>
          </div>

          {/* Credentials box */}
          <div
            className="rounded-xl p-5 mb-5 border-2"
            style={{ background: "#f8f5ec", borderColor: "#B88D2A" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "#B88D2A" }}
            >
              {lang === "en"
                ? "Your Login Credentials"
                : "உங்கள் உள்நுழைவு நற்சான்றிதழ்கள்"}
            </p>
            <div className="space-y-3">
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground font-medium">
                  {lang === "en" ? "User ID" : "பயனர் ID"}
                  <span className="ml-2 text-muted-foreground/60 text-xs">
                    {lang === "en" ? "(பயனர் ID)" : "(User ID)"}
                  </span>
                </p>
                <p
                  data-ocid="home.credentials.user_id"
                  className="font-mono font-bold text-lg tracking-widest mt-0.5"
                  style={{ color: "#0B2B4B" }}
                >
                  {credentials.user_id}
                </p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground font-medium">
                  {lang === "en" ? "Password" : "கடவுச்சொல்"}
                  <span className="ml-2 text-muted-foreground/60 text-xs">
                    {lang === "en" ? "(கடவுச்சொல்)" : "(Password)"}
                  </span>
                </p>
                <p
                  data-ocid="home.credentials.password"
                  className="font-mono font-bold text-lg tracking-widest mt-0.5"
                  style={{ color: "#0B2B4B" }}
                >
                  {credentials.password}
                </p>
              </div>
            </div>
          </div>

          {/* SMS notice */}
          <div
            className="rounded-xl p-3 mb-6 flex gap-2 border"
            style={{ background: "#fffbeb", borderColor: "#fde68a" }}
          >
            <span className="text-lg">📱</span>
            <p className="text-sm" style={{ color: "#92400e" }}>
              {lang === "en"
                ? "Your credentials have been sent to your registered mobile number via SMS."
                : "உங்கள் நற்சான்றிதழ்கள் உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண்ணுக்கு SMS மூலம் அனுப்பப்பட்டுள்ளன."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              data-ocid="home.proceed_to_login.button"
              className="w-full h-12 rounded-xl font-bold text-base transition-smooth"
              style={{ background: "#0B2B4B", color: "#fff" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#163d6a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#0B2B4B";
              }}
              onClick={() => setPage("student-login")}
            >
              {lang === "en" ? "Proceed to Login →" : "உள்நுழைவுக்கு தொடரவும் →"}
            </Button>
            <Button
              data-ocid="home.copy_credentials.button"
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold transition-smooth"
              style={{ borderColor: "#B88D2A", color: "#B88D2A" }}
              onClick={handleCopyCredentials}
            >
              {copied ? (
                <>
                  <CheckCircle
                    className="mr-2 h-4 w-4"
                    style={{ color: "#16a34a" }}
                  />
                  {lang === "en" ? "Copied!" : "நகலெடுக்கப்பட்டது!"}
                </>
              ) : (
                <>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  {lang === "en"
                    ? "Copy Credentials"
                    : "நற்சான்றிதழ்களை நகலெடுக்கவும்"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #0B2B4B 0%, #163d6a 60%, #1a4a7e 100%)",
      }}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden">
        {/* Header banner */}
        <div
          className="px-8 py-6"
          style={{ background: "linear-gradient(90deg, #0B2B4B, #1a4a7e)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: "#B88D2A", color: "#0B2B4B" }}
              >
                MK
              </div>
              <div>
                <h1
                  className="font-bold text-lg leading-tight"
                  style={{ color: "#B88D2A" }}
                >
                  MKJC
                </h1>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {lang === "en"
                    ? "Scholarship Exam Portal"
                    : "உதவித்தொகை தேர்வு"}
                </p>
              </div>
            </div>

            {/* Language toggle */}
            {setLang && (
              <button
                data-ocid="home.lang_toggle.toggle"
                type="button"
                onClick={() => setLang(lang === "en" ? "ta" : "en")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth"
                style={{
                  background: "rgba(184,141,42,0.2)",
                  color: "#B88D2A",
                  border: "1px solid rgba(184,141,42,0.4)",
                }}
              >
                <Globe className="h-3.5 w-3.5" />
                {lang === "en" ? "தமிழ்" : "English"}
              </button>
            )}
          </div>
        </div>

        {/* Form body */}
        <div className="px-8 py-6">
          <p className="text-sm text-muted-foreground mb-5 text-center">
            {lang === "en"
              ? "Fill in your details to register for the exam"
              : "தேர்வுக்கு பதிவு செய்ய உங்கள் விவரங்களை பூர்த்தி செய்யுங்கள்"}
          </p>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label
                htmlFor="student_name"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block"
              >
                {lang === "en" ? "Student Name *" : "மாணவர் பெயர் *"}
              </label>
              <Input
                id="student_name"
                data-ocid="home.student_name.input"
                value={form.student_name}
                onChange={(e) => handleChange("student_name", e.target.value)}
                placeholder={
                  lang === "en" ? "Enter full name" : "முழு பெயரை உள்ளிடுக"
                }
                className="rounded-xl h-11 border-input focus-visible:ring-2"
                style={{
                  fontFamily:
                    "'Plus Jakarta Sans', 'Noto Sans Tamil', sans-serif",
                }}
                required
              />
            </div>

            <div>
              <label
                htmlFor="school_name"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block"
              >
                {lang === "en" ? "School Name" : "பள்ளி பெயர்"}
              </label>
              <Input
                id="school_name"
                data-ocid="home.school_name.input"
                value={form.school_name}
                onChange={(e) => handleChange("school_name", e.target.value)}
                placeholder={
                  lang === "en" ? "Enter school name" : "பள்ளி பெயரை உள்ளிடுக"
                }
                className="rounded-xl h-11 border-input"
                style={{
                  fontFamily:
                    "'Plus Jakarta Sans', 'Noto Sans Tamil', sans-serif",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="exam_group"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block"
              >
                {lang === "en" ? "12th Group Studied" : "12ஆம் வகுப்பு பிரிவு"}
              </label>
              <Input
                id="exam_group"
                data-ocid="home.exam_group.input"
                value={form.exam_group}
                onChange={(e) => handleChange("exam_group", e.target.value)}
                placeholder={
                  lang === "en"
                    ? "e.g. Science, Commerce, Arts"
                    : "எ.கா. அறிவியல், வணிகம், கலை"
                }
                className="rounded-xl h-11 border-input"
                style={{
                  fontFamily:
                    "'Plus Jakarta Sans', 'Noto Sans Tamil', sans-serif",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="contact_number"
                  className="text-xs font-semibold text-muted-foreground mb-1.5 block"
                >
                  {lang === "en" ? "Contact Number" : "தொலைபேசி எண்"}
                </label>
                <Input
                  id="contact_number"
                  data-ocid="home.contact_number.input"
                  value={form.contact_number}
                  onChange={(e) =>
                    handleChange("contact_number", e.target.value)
                  }
                  placeholder={lang === "en" ? "Mobile no." : "மொபைல் எண்"}
                  type="tel"
                  className="rounded-xl h-11 border-input"
                />
              </div>
              <div>
                <label
                  htmlFor="whatsapp_number"
                  className="text-xs font-semibold text-muted-foreground mb-1.5 block"
                >
                  {lang === "en" ? "WhatsApp Number" : "வாட்ஸ்அப் எண்"}
                </label>
                <Input
                  id="whatsapp_number"
                  data-ocid="home.whatsapp_number.input"
                  value={form.whatsapp_number}
                  onChange={(e) =>
                    handleChange("whatsapp_number", e.target.value)
                  }
                  placeholder={lang === "en" ? "WhatsApp no." : "வாட்ஸ்அப்"}
                  type="tel"
                  className="rounded-xl h-11 border-input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="test_key_trigger"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block"
              >
                {lang === "en" ? "Select Exam *" : "தேர்வை தேர்ந்தெடுக்கவும் *"}
              </label>
              <Select
                value={form.test_key}
                onValueChange={(v) => handleChange("test_key", v)}
              >
                <SelectTrigger
                  id="test_key_trigger"
                  data-ocid="home.test_key.select"
                  className="rounded-xl h-11 border-input"
                >
                  <SelectValue
                    placeholder={
                      lang === "en"
                        ? "Choose an exam..."
                        : "தேர்வை தேர்ந்தெடுக்கவும்..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {examTests.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Primary CTA */}
            <Button
              type="submit"
              data-ocid="home.start_now.button"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-base mt-2 transition-smooth"
              style={{ background: "#B88D2A", color: "#0B2B4B" }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#a07825";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#B88D2A";
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {lang === "en" ? "Registering..." : "பதிவு செய்கிறது..."}
                </>
              ) : lang === "en" ? (
                "Start Now"
              ) : (
                "இப்போது தொடங்குங்கள்"
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Staff Login */}
            <Button
              type="button"
              data-ocid="home.staff_login.button"
              variant="outline"
              className="w-full h-11 rounded-xl font-semibold transition-smooth"
              style={{ borderColor: "#0B2B4B", color: "#0B2B4B" }}
              onClick={() => setPage("admin")}
            >
              {lang === "en" ? "Staff Login" : "ஊழியர் உள்நுழைவு"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
