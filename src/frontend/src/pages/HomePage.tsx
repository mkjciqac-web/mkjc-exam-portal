import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import type { Exam } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface HomePageProps {
  startExam: (regId: bigint, testKey: string) => void;
  setPage: (p: Page) => void;
  lang: Lang;
}

export default function HomePage({ startExam, setPage, lang }: HomePageProps) {
  const { actor } = useActor();
  const [form, setForm] = useState({
    student_name: "",
    school_name: "",
    contact_number: "",
    whatsapp_number: "",
    test_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    if (!actor) return;
    (actor as any)
      .getAllExams()
      .then(setExams)
      .catch(() => {});
  }, [actor]);

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
      toast.success(
        lang === "en"
          ? "Registered! Starting exam..."
          : "பதிவு முடிந்தது! தேர்வு தொடங்குகிறது...",
      );
      startExam(regId, form.test_key);
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
              {exams.length > 0
                ? exams.map((exam) => (
                    <SelectItem
                      key={exam.id.toString()}
                      value={`EXAM-${exam.id}`}
                    >
                      {exam.exam_name}
                    </SelectItem>
                  ))
                : [
                    { label: "Mathematics - Test 1", value: "Test1" },
                    { label: "Science - Test 2", value: "Test2" },
                    { label: "General Knowledge - Test 3", value: "Test3" },
                  ].map((t) => (
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
                {lang === "en" ? "Starting..." : "தொடங்குகிறது..."}
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
