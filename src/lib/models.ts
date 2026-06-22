export type ModelOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const MODELS: ModelOption[] = [
  { id: "auto", name: "تلقائي", description: "يختار أفضل نموذج تلقائياً", icon: "✦" },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", description: "سريع ومتوازن", icon: "G" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", description: "الأقوى للتحليل العميق", icon: "G" },
  { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", description: "ممتاز للكتابة والشعر", icon: "C" },
  { id: "openai/gpt-5.2", name: "GPT-5.2", description: "متعدد المهام", icon: "O" },
  { id: "openai/gpt-5.2-mini", name: "GPT-5.2 Mini", description: "خفيف وسريع", icon: "O" },
];

export const DEFAULT_MODEL_ID = "auto";
export const AUTO_RESOLVES_TO = "google/gemini-3-flash-preview";

export function resolveModelId(id: string): string {
  if (id === "auto") return AUTO_RESOLVES_TO;
  return id;
}