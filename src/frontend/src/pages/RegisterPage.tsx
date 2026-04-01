import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lang, Page } from "../App";
import { useActor } from "../hooks/useActor";

interface RegisterPageProps {
  setPage: (p: Page) => void;
  lang: Lang;
  goToResults: (id: bigint) => void;
}

const t = {
  en: {
    title: "STUDENT REGISTRATION",
    subtitle:
      "Fill in your details to register for the scholarship examination.",
    studentName: "Student Name",
    schoolName: "School Name",
    contactNumber: "Contact Number",
    whatsappNumber: "WhatsApp Number",
    examGroup: "Exam Group",
    testKey: "Select Test",
    submit: "Register Now",
    submitting: "Registering...",
    successTitle: "Registration Successful!",
    successMsg: "Your Registration ID is:",
    takeExam: "Proceed to Take Exam",
    required: "This field is required",
    selectGroup: "Select Exam Group",
    selectTest: "Select Test",
  },
  ta: {
    title: "மாணவர் பதிவு",
    subtitle: "உதவித்தொகை தேர்வுக்கு பதிவு செய்ய உங்கள் விவரங்களை பூர்த்தி செய்யுங்கள்.",
    studentName: "மாணவர் பெயர்",
    schoolName: "பள்ளி பெயர்",
    contactNumber: "தொலைபேசி எண்",
    whatsappNumber: "வாட்ஸ்அப் எண்",
    examGroup: "தேர்வு குழு",
    testKey: "தேர்வு தேர்ந்தெடுக்கவும்",
    submit: "பதிவு செய்யுங்கள்",
    submitting: "பதிவு செய்கிறது...",
    successTitle: "பதிவு வெற்றிகரமாக முடிந்தது!",
    successMsg: "உங்கள் பதிவு ID:",
    takeExam: "தேர்வு எழுத செல்லுங்கள்",
    required: "இந்த புலம் தேவை",
    selectGroup: "தேர்வு குழுவை தேர்ந்தெடுக்கவும்",
    selectTest: "தேர்வை தேர்ந்தெடுக்கவும்",
  },
};

const examGroups = ["Mathematics", "Science", "General Knowledge"];
const testKeys = ["Test1", "Test2", "Test3"];

export default function RegisterPage({ setPage, lang }: RegisterPageProps) {
  const tx = t[lang];
  const { actor } = useActor();
  const [form, setForm] = useState({
    student_name: "",
    school_name: "",
    contact_number: "",
    whatsapp_number: "",
    exam_group: "",
    test_key: "",
  });
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState<bigint | null>(null);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) {
      toast.error("Backend not ready");
      return;
    }
    if (!form.student_name || !form.exam_group || !form.test_key) {
      toast.error(tx.required);
      return;
    }
    setLoading(true);
    try {
      const id = await actor.createRegistration(
        form.student_name,
        form.school_name,
        form.contact_number,
        form.whatsapp_number,
        form.exam_group,
        form.test_key,
      );
      setRegistrationId(id);
      toast.success(
        lang === "en"
          ? "Registration successful!"
          : "பதிவு வெற்றிகரமாக முடிந்தது!",
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

  if (registrationId !== null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-lg shadow-card p-10 max-w-md w-full text-center"
          data-ocid="register.success_state"
        >
          <CheckCircle className="h-16 w-16 text-gold mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-navy mb-2">
            {tx.successTitle}
          </h2>
          <p className="text-muted-foreground mb-4">{tx.successMsg}</p>
          <div className="bg-navy/5 rounded-lg px-6 py-4 mb-6">
            <span className="font-display font-bold text-3xl text-navy">
              {registrationId.toString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === "en"
              ? "Please save this ID. You will need it to take the exam."
              : "இந்த ID ஐ சேமித்து வையுங்கள். தேர்வு எழுத இது தேவைப்படும்."}
          </p>
          <Button
            data-ocid="register.exam.primary_button"
            className="w-full bg-gold text-navy font-bold hover:bg-gold/90"
            onClick={() => setPage("exam")}
          >
            {tx.takeExam}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg shadow-card p-8"
        >
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl uppercase tracking-wider text-navy mb-2">
              {tx.title}
            </h1>
            <p className="text-muted-foreground">{tx.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="student_name" className="text-navy font-medium">
                  {tx.studentName} *
                </Label>
                <Input
                  id="student_name"
                  data-ocid="register.student_name.input"
                  value={form.student_name}
                  onChange={(e) => handleChange("student_name", e.target.value)}
                  placeholder={lang === "en" ? "Enter full name" : "பூரண பெயர்"}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="school_name" className="text-navy font-medium">
                  {tx.schoolName}
                </Label>
                <Input
                  id="school_name"
                  data-ocid="register.school_name.input"
                  value={form.school_name}
                  onChange={(e) => handleChange("school_name", e.target.value)}
                  placeholder={
                    lang === "en" ? "Enter school name" : "பள்ளி பெயர்"
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="contact_number"
                  className="text-navy font-medium"
                >
                  {tx.contactNumber}
                </Label>
                <Input
                  id="contact_number"
                  data-ocid="register.contact_number.input"
                  value={form.contact_number}
                  onChange={(e) =>
                    handleChange("contact_number", e.target.value)
                  }
                  placeholder="10-digit number"
                  type="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="whatsapp_number"
                  className="text-navy font-medium"
                >
                  {tx.whatsappNumber}
                </Label>
                <Input
                  id="whatsapp_number"
                  data-ocid="register.whatsapp_number.input"
                  value={form.whatsapp_number}
                  onChange={(e) =>
                    handleChange("whatsapp_number", e.target.value)
                  }
                  placeholder="WhatsApp number"
                  type="tel"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-navy font-medium">
                  {tx.examGroup} *
                </Label>
                <Select
                  value={form.exam_group}
                  onValueChange={(v) => handleChange("exam_group", v)}
                >
                  <SelectTrigger data-ocid="register.exam_group.select">
                    <SelectValue placeholder={tx.selectGroup} />
                  </SelectTrigger>
                  <SelectContent>
                    {examGroups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-navy font-medium">{tx.testKey} *</Label>
                <Select
                  value={form.test_key}
                  onValueChange={(v) => handleChange("test_key", v)}
                >
                  <SelectTrigger data-ocid="register.test_key.select">
                    <SelectValue placeholder={tx.selectTest} />
                  </SelectTrigger>
                  <SelectContent>
                    {testKeys.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              data-ocid="register.submit_button"
              disabled={loading}
              className="w-full bg-gold text-navy font-bold hover:bg-gold/90 mt-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tx.submitting}
                </>
              ) : (
                tx.submit
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
