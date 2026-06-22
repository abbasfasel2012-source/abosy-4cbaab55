export type ModelOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const MODELS: ModelOption[] = [
  { id: "auto", name: "تلقائي", description: "يختار أفضل نموذج تلقائياً", icon: "✦" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "سريع ومتوازن", icon: "G" },
  { id: "google/gemini-2.0-pro-exp-02-05", name: "Gemini 2.0 Pro", description: "الأقوى للتحليل العميق", icon: "G" },
  { id: "anthropic/claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", description: "ممتاز للكتابة والشعر", icon: "C" },
  { id: "openai/gpt-4o", name: "GPT-4o", description: "متعدد المهام", icon: "O" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", description: "خفيف وسريع", icon: "O" },
];

export const DEFAULT_MODEL_ID = "auto";
export const AUTO_RESOLVES_TO = "google/gemini-2.0-flash";

export function resolveModelId(id: string): string {
  if (id === "auto") return AUTO_RESOLVES_TO;
  return id;
}
