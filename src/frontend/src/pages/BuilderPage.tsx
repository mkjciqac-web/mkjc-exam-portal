import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Download,
  FileInput,
  MousePointer,
  RotateCcw,
  Text,
  Trash2,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ControlType =
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "button"
  | "date"
  | "file";

interface FormControl {
  id: string;
  type: ControlType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string; // comma-separated for select/radio/checkbox
  buttonText: string;
}

interface BuilderPageProps {
  setPage: (page: string) => void;
}

// ── Palette definition ─────────────────────────────────────────────────────────
const PALETTE: { type: ControlType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Text Input", icon: <Type className="h-6 w-6" /> },
  { type: "textarea", label: "Textarea", icon: <Text className="h-6 w-6" /> },
  {
    type: "select",
    label: "Select Dropdown",
    icon: <ChevronDown className="h-6 w-6" />,
  },
  {
    type: "checkbox",
    label: "Checkbox Group",
    icon: <CheckSquare className="h-6 w-6" />,
  },
  {
    type: "radio",
    label: "Radio Buttons",
    icon: <Circle className="h-6 w-6" />,
  },
  {
    type: "button",
    label: "Button",
    icon: <MousePointer className="h-6 w-6" />,
  },
  {
    type: "date",
    label: "Date Picker",
    icon: <Calendar className="h-6 w-6" />,
  },
  {
    type: "file",
    label: "File Upload",
    icon: <FileInput className="h-6 w-6" />,
  },
];

// ── Preset CSS themes ──────────────────────────────────────────────────────────
const THEMES: Record<string, string> = {
  Default: `body { font-family: Arial, sans-serif; background: #f5f7fa; padding: 24px; }
form { background: white; padding: 32px; border-radius: 8px; max-width: 540px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.form-title { font-size: 22px; font-weight: 700; color: #0B2B4B; margin-bottom: 24px; }
.field-group { margin-bottom: 18px; }
label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px; }
input[type=text], input[type=date], input[type=file], textarea, select {
  width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 14px; background: #fff; color: #111827; box-sizing: border-box; }
textarea { min-height: 90px; resize: vertical; }
button[type=submit], .form-btn {
  background: #0B2B4B; color: white; border: none; padding: 11px 28px;
  border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%; }
button[type=submit]:hover, .form-btn:hover { background: #1a4a7a; }
.radio-group, .checkbox-group { display: flex; flex-direction: column; gap: 6px; }
.radio-option, .checkbox-option { display: flex; align-items: center; gap: 8px; font-size: 14px; }`,

  Dark: `body { font-family: 'Segoe UI', sans-serif; background: #111827; padding: 24px; }
form { background: #1f2937; padding: 32px; border-radius: 10px; max-width: 540px; margin: 0 auto; border: 1px solid #374151; }
.form-title { font-size: 22px; font-weight: 700; color: #f9fafb; margin-bottom: 24px; }
.field-group { margin-bottom: 18px; }
label { display: block; font-size: 14px; font-weight: 500; color: #d1d5db; margin-bottom: 6px; }
input[type=text], input[type=date], input[type=file], textarea, select {
  width: 100%; padding: 10px 12px; border: 1px solid #4b5563; border-radius: 6px;
  font-size: 14px; background: #374151; color: #f9fafb; box-sizing: border-box; }
textarea { min-height: 90px; resize: vertical; }
button[type=submit], .form-btn {
  background: #B88D2A; color: #111827; border: none; padding: 11px 28px;
  border-radius: 6px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; }
button[type=submit]:hover, .form-btn:hover { background: #d4a93e; }
.radio-group, .checkbox-group { display: flex; flex-direction: column; gap: 6px; }
.radio-option, .checkbox-option { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #d1d5db; }`,

  Modern: `body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 16px; }
form { background: white; padding: 36px; border-radius: 16px; max-width: 520px; margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.form-title { font-size: 24px; font-weight: 800; color: #1a1a2e; margin-bottom: 28px; text-align: center; }
.field-group { margin-bottom: 20px; }
label { display: block; font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
input[type=text], input[type=date], input[type=file], textarea, select {
  width: 100%; padding: 12px 14px; border: 2px solid #e5e7eb; border-radius: 10px;
  font-size: 15px; background: #f9fafb; color: #111827; box-sizing: border-box; transition: border-color 0.2s; }
input:focus, textarea:focus, select:focus { outline: none; border-color: #667eea; background: white; }
textarea { min-height: 100px; resize: vertical; }
button[type=submit], .form-btn {
  background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 14px 28px;
  border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; letter-spacing: 0.02em; }
.radio-group, .checkbox-group { display: flex; flex-direction: column; gap: 8px; }
.radio-option, .checkbox-option { display: flex; align-items: center; gap: 10px; font-size: 14px; }`,

  Minimal: `body { font-family: Georgia, 'Times New Roman', serif; background: #fafaf8; padding: 32px; }
form { background: white; padding: 40px; max-width: 480px; margin: 0 auto; border: 1px solid #e8e8e0; }
.form-title { font-size: 26px; font-weight: 700; color: #1a1a1a; margin-bottom: 32px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
.field-group { margin-bottom: 22px; }
label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; letter-spacing: 0.08em; text-transform: uppercase; }
input[type=text], input[type=date], input[type=file], textarea, select {
  width: 100%; padding: 10px 0; border: none; border-bottom: 1px solid #ccc; border-radius: 0;
  font-size: 15px; background: transparent; color: #1a1a1a; box-sizing: border-box; }
textarea { min-height: 90px; resize: vertical; border: 1px solid #ccc; padding: 8px; }
button[type=submit], .form-btn {
  background: #1a1a1a; color: white; border: none; padding: 12px 28px;
  font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: 0.1em; text-transform: uppercase; width: 100%; }
button[type=submit]:hover, .form-btn:hover { background: #333; }
.radio-group, .checkbox-group { display: flex; flex-direction: column; gap: 8px; }
.radio-option, .checkbox-option { display: flex; align-items: center; gap: 10px; font-size: 14px; }`,
};

// ── Default JS template ────────────────────────────────────────────────────────
const DEFAULT_JS = `document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('builderForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Collect all form data
    const data = new FormData(form);
    const values = {};
    for (const [key, value] of data.entries()) {
      values[key] = value;
    }

    // Basic validation
    let isValid = true;
    form.querySelectorAll('[required]').forEach(function(field) {
      if (!field.value.trim()) {
        field.style.borderColor = '#ef4444';
        isValid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!isValid) {
      alert('Please fill in all required fields.');
      return;
    }

    // TODO: Replace with your actual submission logic
    console.log('Form data:', values);
    alert('Form submitted successfully!\\n' + JSON.stringify(values, null, 2));
  });

  // Clear validation highlight on input
  form.querySelectorAll('input, textarea, select').forEach(function(field) {
    field.addEventListener('input', function() {
      this.style.borderColor = '';
    });
  });
});`;

// ── Helpers ────────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultControl(type: ControlType): FormControl {
  const defaults: Record<ControlType, Partial<FormControl>> = {
    text: { label: "Full Name", placeholder: "Enter your full name" },
    textarea: { label: "Message", placeholder: "Type your message here..." },
    select: { label: "Select Option", options: "Option 1,Option 2,Option 3" },
    checkbox: { label: "Preferences", options: "Choice A,Choice B,Choice C" },
    radio: { label: "Gender", options: "Male,Female,Other" },
    button: { label: "", buttonText: "Submit Form" },
    date: { label: "Date of Birth", placeholder: "" },
    file: { label: "Upload Document", placeholder: "" },
  };
  return {
    id: uid(),
    type,
    label: defaults[type].label ?? type,
    placeholder: defaults[type].placeholder ?? "",
    required: false,
    options: defaults[type].options ?? "",
    buttonText: defaults[type].buttonText ?? "Submit",
  };
}

function renderControlHtml(ctrl: FormControl): string {
  const name = ctrl.id;
  const req = ctrl.required ? " required" : "";
  const reqMark = ctrl.required ? " <span style='color:#ef4444'>*</span>" : "";

  switch (ctrl.type) {
    case "text":
      return `<div class="field-group">
  <label for="${name}">${ctrl.label}${reqMark}</label>
  <input type="text" id="${name}" name="${name}" placeholder="${ctrl.placeholder}"${req}>
</div>`;
    case "textarea":
      return `<div class="field-group">
  <label for="${name}">${ctrl.label}${reqMark}</label>
  <textarea id="${name}" name="${name}" placeholder="${ctrl.placeholder}"${req}></textarea>
</div>`;
    case "select": {
      const opts = ctrl.options
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      return `<div class="field-group">
  <label for="${name}">${ctrl.label}${reqMark}</label>
  <select id="${name}" name="${name}"${req}>
    <option value="">-- Select --</option>
    ${opts.map((o) => `<option value="${o}">${o}</option>`).join("\n    ")}
  </select>
</div>`;
    }
    case "checkbox": {
      const opts = ctrl.options
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      return `<div class="field-group">
  <label>${ctrl.label}${reqMark}</label>
  <div class="checkbox-group">
    ${opts.map((o, i) => `<label class="checkbox-option"><input type="checkbox" name="${name}" value="${o}" id="${name}_${i}"> ${o}</label>`).join("\n    ")}
  </div>
</div>`;
    }
    case "radio": {
      const opts = ctrl.options
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      return `<div class="field-group">
  <label>${ctrl.label}${reqMark}</label>
  <div class="radio-group">
    ${opts.map((o, i) => `<label class="radio-option"><input type="radio" name="${name}" value="${o}" id="${name}_${i}"${req}> ${o}</label>`).join("\n    ")}
  </div>
</div>`;
    }
    case "button":
      return `<div class="field-group">
  <button type="submit" class="form-btn">${ctrl.buttonText}</button>
</div>`;
    case "date":
      return `<div class="field-group">
  <label for="${name}">${ctrl.label}${reqMark}</label>
  <input type="date" id="${name}" name="${name}"${req}>
</div>`;
    case "file":
      return `<div class="field-group">
  <label for="${name}">${ctrl.label}${reqMark}</label>
  <input type="file" id="${name}" name="${name}"${req}>
</div>`;
    default:
      return "";
  }
}

function buildIframeDoc(
  controls: FormControl[],
  css: string,
  js: string,
  formTitle: string,
  selectedId: string | null,
): string {
  const selectionScript = selectedId
    ? `
<script>
document.addEventListener('DOMContentLoaded', function() {
  var el = document.querySelector('[data-ctrl-id="${selectedId}"]');
  if (el) {
    el.style.outline = '2px solid #B88D2A';
    el.style.outlineOffset = '3px';
    el.style.borderRadius = '4px';
  }
});
</script>`
    : "";

  const clickScript = `
<script>
document.addEventListener('click', function(e) {
  var ctrl = e.target.closest('[data-ctrl-id]');
  if (ctrl) {
    window.parent.postMessage({ type: 'selectControl', id: ctrl.getAttribute('data-ctrl-id') }, '*');
  }
});
</script>`;

  const wrappedControls = controls.map((c) => {
    const html = renderControlHtml(c);
    return `<div data-ctrl-id="${c.id}">${html}</div>`;
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
[data-ctrl-id] { cursor: pointer; transition: outline 0.1s; }
[data-ctrl-id]:hover { outline: 1px dashed #B88D2A; outline-offset: 2px; border-radius: 4px; }
</style>
</head>
<body>
<form id="builderForm" onsubmit="return false;">
${formTitle ? `<div class="form-title">${formTitle}</div>` : ""}
${wrappedControls.join("\n")}
</form>
${selectionScript}
${clickScript}
<script>
${js}
</script>
</body>
</html>`;
}

function buildExportDoc(
  controls: FormControl[],
  css: string,
  js: string,
  formTitle: string,
): string {
  const controlsHtml = controls.map(renderControlHtml).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${formTitle || "Form"}</title>
<style>
${css}
</style>
</head>
<body>
<form id="builderForm" method="POST" action="#">
${formTitle ? `<div class="form-title">${formTitle}</div>` : ""}
${controlsHtml}
</form>
<script>
${js}
</script>
</body>
</html>`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function BuilderPage({ setPage }: BuilderPageProps) {
  const [controls, setControls] = useState<FormControl[]>([
    {
      ...defaultControl("text"),
      label: "Full Name",
      placeholder: "Enter your full name",
    },
    {
      ...defaultControl("text"),
      id: uid(),
      label: "Email Address",
      placeholder: "you@example.com",
    },
    { ...defaultControl("button"), id: uid() },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("Registration Form");
  const [css, setCss] = useState(THEMES.Default);
  const [js, setJs] = useState(DEFAULT_JS);
  const [activeTab, setActiveTab] = useState<
    "controls" | "properties" | "css" | "js"
  >("controls");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selected = controls.find((c) => c.id === selectedId) ?? null;

  // Listen for iframe click messages
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "selectControl") {
        setSelectedId(e.data.id);
        setActiveTab("properties");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Rebuild iframe on any change
  const rebuildIframe = useCallback(() => {
    if (!iframeRef.current) return;
    const doc = buildIframeDoc(controls, css, js, formTitle, selectedId);
    const iframe = iframeRef.current;
    iframe.srcdoc = doc;
  }, [controls, css, js, formTitle, selectedId]);

  useEffect(() => {
    rebuildIframe();
  }, [rebuildIframe]);

  function addControl(type: ControlType) {
    const ctrl = defaultControl(type);
    setControls((prev) => [...prev, ctrl]);
    setSelectedId(ctrl.id);
    setActiveTab("properties");
  }

  function updateSelected(field: keyof FormControl, value: string | boolean) {
    if (!selectedId) return;
    setControls((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, [field]: value } : c)),
    );
  }

  function deleteControl(id: string) {
    setControls((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveControl(id: string, dir: -1 | 1) {
    setControls((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function applyTheme(name: string) {
    setCss(THEMES[name]);
  }

  function handleExport() {
    const html = buildExportDoc(controls, css, js, formTitle);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "form_builder_export.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setControls([]);
    setSelectedId(null);
  }

  const sidebarTabClass = (tab: string) =>
    `flex-1 py-2 text-xs font-semibold transition-colors ${
      activeTab === tab
        ? "text-amber-400 border-b-2 border-amber-400"
        : "text-white/60 hover:text-white border-b-2 border-transparent"
    }`;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      {/* ── Top toolbar ─────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-[#0B2B4B]">
        <button
          type="button"
          data-ocid="builder.back.button"
          onClick={() => setPage("admin")}
          className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </button>

        <div className="w-px h-5 bg-white/20 mx-1" />

        <span className="font-display font-bold text-white text-base tracking-wide">
          MKJC Form Builder
        </span>

        <div className="flex-1" />

        <Input
          data-ocid="builder.form_title.input"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Form title..."
          className="w-52 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-amber-400"
        />

        <button
          type="button"
          data-ocid="builder.clear.button"
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border text-white/70 border-white/20 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear All
        </button>

        <button
          type="button"
          data-ocid="builder.export.button"
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-[#0B2B4B] transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export HTML
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ─────────────────────────────────────── */}
        <aside className="flex flex-col w-64 shrink-0 overflow-hidden border-r border-white/10 bg-[#0B2B4B]">
          {/* Tab strip */}
          <div className="flex border-b border-white/10 shrink-0">
            {(["controls", "properties", "css", "js"] as const).map((t) => (
              <button
                type="button"
                key={t}
                data-ocid={`builder.sidebar.${t}.tab`}
                className={sidebarTabClass(t)}
                onClick={() => setActiveTab(t)}
              >
                {t === "controls"
                  ? "Controls"
                  : t === "properties"
                    ? "Props"
                    : t === "css"
                      ? "CSS"
                      : "JS"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* ── Controls palette ── */}
            {activeTab === "controls" && (
              <>
                <p className="text-xs text-white/50 uppercase tracking-widest font-semibold px-1 mb-1">
                  Click to Add
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PALETTE.map((item) => (
                    <button
                      type="button"
                      key={item.type}
                      data-ocid={`builder.palette.${item.type}`}
                      onClick={() => addControl(item.type)}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg text-xs font-medium text-white/80 border border-white/10 transition-all hover:border-amber-400 hover:text-white hover:bg-white/5"
                    >
                      <span className="text-white/60">{item.icon}</span>
                      <span className="text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Controls list */}
                {controls.length > 0 && (
                  <>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-semibold px-1 mt-4 mb-1">
                      Form Fields
                    </p>
                    <div className="space-y-1">
                      {controls.map((ctrl, idx) => (
                        <button
                          type="button"
                          key={ctrl.id}
                          data-ocid={`builder.field.item.${idx + 1}`}
                          className={`w-full flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all group text-left border ${
                            selectedId === ctrl.id
                              ? "bg-amber-400/15 border-amber-400/40"
                              : "bg-white/[0.04] border-transparent"
                          }`}
                          onClick={() => {
                            setSelectedId(ctrl.id);
                            setActiveTab("properties");
                          }}
                        >
                          <span className="text-white/50 text-xs flex-1 truncate">
                            {ctrl.type === "button"
                              ? ctrl.buttonText
                              : ctrl.label}
                          </span>
                          <span className="text-white/30 text-xs font-mono">
                            {ctrl.type}
                          </span>
                          <button
                            type="button"
                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveControl(ctrl.id, -1);
                            }}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveControl(ctrl.id, 1);
                            }}
                            disabled={idx === controls.length - 1}
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteControl(ctrl.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Property editor ── */}
            {activeTab === "properties" &&
              (selected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                      {selected.type} field
                    </p>
                    <button
                      type="button"
                      data-ocid="builder.field.delete_button"
                      onClick={() => deleteControl(selected.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete control"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {selected.type !== "button" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        Label Text
                      </Label>
                      <input
                        data-ocid="builder.props.label.input"
                        type="text"
                        value={selected.label}
                        onChange={(e) =>
                          updateSelected("label", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-sm rounded bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {selected.type === "button" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        Button Text
                      </Label>
                      <input
                        data-ocid="builder.props.button_text.input"
                        type="text"
                        value={selected.buttonText}
                        onChange={(e) =>
                          updateSelected("buttonText", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-sm rounded bg-white/10 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {(selected.type === "text" ||
                    selected.type === "textarea") && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        Placeholder
                      </Label>
                      <input
                        data-ocid="builder.props.placeholder.input"
                        type="text"
                        value={selected.placeholder}
                        onChange={(e) =>
                          updateSelected("placeholder", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-sm rounded bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400"
                        placeholder="Placeholder text..."
                      />
                    </div>
                  )}

                  {(selected.type === "select" ||
                    selected.type === "radio" ||
                    selected.type === "checkbox") && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/60">
                        Options (comma-separated)
                      </Label>
                      <textarea
                        data-ocid="builder.props.options.input"
                        value={selected.options}
                        onChange={(e) =>
                          updateSelected("options", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-sm rounded bg-white/10 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 resize-none"
                        rows={3}
                        placeholder="Option 1,Option 2,Option 3"
                      />
                    </div>
                  )}

                  {selected.type !== "button" && (
                    <div className="flex items-center justify-between py-2 px-1">
                      <Label className="text-xs text-white/60">
                        Required Field
                      </Label>
                      <button
                        type="button"
                        data-ocid="builder.props.required.toggle"
                        onClick={() =>
                          updateSelected("required", !selected.required)
                        }
                        className={`w-10 h-5 rounded-full relative transition-colors ${selected.required ? "bg-amber-400" : "bg-white/20"}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${selected.required ? "left-5" : "left-0.5"}`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Reorder */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-white/60 border border-white/15 rounded hover:border-white/30 transition-colors"
                      onClick={() => moveControl(selected.id, -1)}
                    >
                      <ArrowUp className="h-3 w-3" /> Move Up
                    </button>
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-white/60 border border-white/15 rounded hover:border-white/30 transition-colors"
                      onClick={() => moveControl(selected.id, 1)}
                    >
                      <ArrowDown className="h-3 w-3" /> Move Down
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <MousePointer className="h-8 w-8 text-white/20 mb-2" />
                  <p className="text-xs text-white/40">
                    Click a field in the preview
                    <br />
                    to edit its properties
                  </p>
                </div>
              ))}

            {/* ── CSS editor ── */}
            {activeTab === "css" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                    Preset Themes
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(THEMES).map((name) => (
                      <button
                        type="button"
                        key={name}
                        data-ocid={`builder.theme.${name.toLowerCase()}.button`}
                        onClick={() => applyTheme(name)}
                        className="py-1.5 text-xs font-medium rounded border transition-all text-white/70 border-white/15 hover:border-amber-400 hover:text-white"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                    Custom CSS
                  </p>
                  <textarea
                    data-ocid="builder.css.editor"
                    value={css}
                    onChange={(e) => setCss(e.target.value)}
                    className="w-full text-xs font-mono rounded bg-black/30 border border-white/15 text-green-300 p-2 focus:outline-none focus:border-amber-400 resize-none"
                    rows={20}
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* ── JS editor ── */}
            {activeTab === "js" && (
              <div className="space-y-3">
                <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                  JavaScript Code
                </p>
                <p className="text-xs text-white/40 leading-relaxed">
                  Runs inside the exported form. Includes DOMContentLoaded,
                  submit handler, and validation stubs.
                </p>
                <textarea
                  data-ocid="builder.js.editor"
                  value={js}
                  onChange={(e) => setJs(e.target.value)}
                  className="w-full text-xs font-mono rounded bg-black/30 border border-white/15 text-yellow-200 p-2 focus:outline-none focus:border-amber-400 resize-none"
                  rows={24}
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="w-full py-1.5 text-xs text-white/50 border border-white/15 rounded hover:border-white/30 transition-colors"
                  onClick={() => setJs(DEFAULT_JS)}
                >
                  Reset to Default Template
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right canvas (live preview) ──────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Live Preview
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {controls.length} field{controls.length !== 1 ? "s" : ""}
              </span>
              {selectedId && (
                <>
                  <span>·</span>
                  <span className="text-amber-500">
                    {selected?.type === "button"
                      ? selected.buttonText
                      : selected?.label}{" "}
                    selected
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setSelectedId(null)}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>

          {controls.length === 0 ? (
            <div
              data-ocid="builder.canvas.empty_state"
              className="flex-1 flex flex-col items-center justify-center text-center px-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center mb-4">
                <Type className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-muted-foreground mb-1">
                Your form is empty
              </p>
              <p className="text-sm text-muted-foreground/70">
                Click a control in the left panel to add it here
              </p>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              data-ocid="builder.preview.iframe"
              title="Form Preview"
              className="flex-1 w-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </main>
      </div>
    </div>
  );
}
