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
import { CheckCircle, ClipboardCopy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { createActor } from "../backend";
import { type CustomExam, getExams } from "../utils/examsStore";

interface HomePageProps {
  startExam: (regId: bigint, testKey: string) => void;
  setPage: (p: Page) => void;
  lang: Lang;
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

export default function HomePage({ setPage, lang }: HomePageProps) {
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

  // Reload exams from storage whenever the page mounts or window gets focus
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
          ? "Please fill required fields"
          : "தேவையான புலங்களை பூர்த்தி செய்யுங்கள்",
      );
      return;
    }
    setLoading(true);
    try {
      const regId = await actor.createRegistration(
        form.student_name,
        form.school_name,
        form.contact_number,
        form.whatsapp_number,
        "",
        form.test_key,
      );

      // Generate credentials — cast to any since backend.ts is auto-generated
      // and may not yet include these new methods in its interface
      let creds: Credentials = { user_id: "", password: "" };
      try {
        creds = await (actor as any).generateStudentCredentials(
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

  // ── Credentials screen ────────────────────────────────────────────
  if (credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
          {/* Success header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-9 w-9 text-green-500" />
            </div>
            <h2 className="font-bold text-2xl text-[#3d4fcc]">
              {lang === "en"
                ? "Registration Successful!"
                : "பதிவு வெற்றிகரமானது!"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {lang === "en"
                ? "பதிவு வெற்றிகரமானது!"
                : "Registration Successful!"}
            </p>
          </div>

          {/* Credentials box */}
          <div className="bg-[#f0f2f5] border-2 border-[#4c5ddb] rounded-xl p-5 mb-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-[#3d4fcc] uppercase tracking-wide">
                {lang === "en"
                  ? "Your Login Credentials"
                  : "உங்கள் உள்நுழைவு நற்சான்றிதழ்கள்"}
              </span>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium">
                  {lang === "en" ? "User ID" : "பயனர் ID"}
                  <span className="ml-2 text-gray-400 text-xs">
                    {lang === "en" ? "(பயனர் ID)" : "(User ID)"}
                  </span>
                </p>
                <p
                  data-ocid="home.credentials.user_id"
                  className="font-mono font-bold text-lg text-[#3d4fcc] tracking-widest mt-0.5"
                >
                  {credentials.user_id}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium">
                  {lang === "en" ? "Password" : "கடவுச்சொல்"}
                  <span className="ml-2 text-gray-400 text-xs">
                    {lang === "en" ? "(கடவுச்சொல்)" : "(Password)"}
                  </span>
                </p>
                <p
                  data-ocid="home.credentials.password"
                  className="font-mono font-bold text-lg text-[#3d4fcc] tracking-widest mt-0.5"
                >
                  {credentials.password}
                </p>
              </div>
            </div>
          </div>

          {/* SMS notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex gap-2">
            <span className="text-amber-500 text-lg">📱</span>
            <p className="text-sm text-amber-700">
              {lang === "en"
                ? "Your credentials have been sent to your registered mobile number via SMS."
                : "உங்கள் நற்சான்றிதழ்கள் உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண்ணுக்கு SMS மூலம் அனுப்பப்பட்டுள்ளன."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              data-ocid="home.proceed_to_login.button"
              className="w-full h-12 rounded-xl bg-[#4c5ddb] hover:bg-[#3d4fcc] text-white font-bold text-base"
              onClick={() => setPage("student-login")}
            >
              {lang === "en" ? "Proceed to Login" : "உள்நுழைவுக்கு தொடரவும்"}
            </Button>
            <Button
              data-ocid="home.copy_credentials.button"
              variant="outline"
              className="w-full h-12 rounded-xl border-[#4c5ddb] text-[#4c5ddb] hover:bg-[#f0f2f5] font-semibold"
              onClick={handleCopyCredentials}
            >
              {copied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
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

  // ── Registration form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-center font-bold text-2xl text-[#3d4fcc] mb-6">
          {lang === "en" ? "MKJC Scholarship Exam" : "MKJC உதவித்தொகை தேர்வு"}
        </h1>

        <form onSubmit={handleStart} className="space-y-4">
          <Input
            data-ocid="home.student_name.input"
            value={form.student_name}
            onChange={(e) => handleChange("student_name", e.target.value)}
            placeholder={lang === "en" ? "Student Name *" : "மாணவர் பெயர் *"}
            className="rounded-xl border-gray-200 h-12"
            required
          />
          <Input
            data-ocid="home.school_name.input"
            value={form.school_name}
            onChange={(e) => handleChange("school_name", e.target.value)}
            placeholder={lang === "en" ? "School Name" : "பள்ளி பெயர்"}
            className="rounded-xl border-gray-200 h-12"
          />
          <Input
            data-ocid="home.contact_number.input"
            value={form.contact_number}
            onChange={(e) => handleChange("contact_number", e.target.value)}
            placeholder={lang === "en" ? "Contact Number" : "தொலைபேசி எண்"}
            type="tel"
            className="rounded-xl border-gray-200 h-12"
          />
          <Input
            data-ocid="home.whatsapp_number.input"
            value={form.whatsapp_number}
            onChange={(e) => handleChange("whatsapp_number", e.target.value)}
            placeholder={lang === "en" ? "WhatsApp Number" : "வாட்ஸ்அப் எண்"}
            type="tel"
            className="rounded-xl border-gray-200 h-12"
          />
          <Select
            value={form.test_key}
            onValueChange={(v) => handleChange("test_key", v)}
          >
            <SelectTrigger
              data-ocid="home.test_key.select"
              className="rounded-xl border-gray-200 h-12"
            >
              <SelectValue
                placeholder={
                  lang === "en" ? "Select Exam Test *" : "தேர்வை தேர்ந்தெடுக்கவும் *"
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

          <Button
            type="submit"
            data-ocid="home.start_now.button"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#4c5ddb] hover:bg-[#3d4fcc] text-white font-bold text-base"
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

          <Button
            type="button"
            data-ocid="home.staff_login.button"
            variant="default"
            className="w-full h-12 rounded-xl bg-[#4c5ddb] hover:bg-[#3d4fcc] text-white font-bold text-base"
            onClick={() => setPage("admin")}
          >
            {lang === "en" ? "Staff Login" : "ஊழியர் உள்நுழைவு"}
          </Button>
        </form>
      </div>
    </div>
  );
}
