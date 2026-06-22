import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import abosyLogo from "@/assets/abosy-logo.png";
import { MODELS, DEFAULT_MODEL_ID } from "@/lib/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "عبوسي — مساعد عراقي ذكي" },
      { name: "description", content: "حجي وية عبوسي بأي شي يخطر ببالك — مساعد ذكي يفهم لهجتك العراقية." },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = [
  { title: "اكتب لي أبوذية", subtitle: "بشعر شعبي عراقي" },
  { title: "شلون أتعلم برمجة؟", subtitle: "ابدأ معاي خطوة خطوة" },
  { title: "اشرح لي حكم شرعي", subtitle: "حسب مرجعية السيستاني" },
  { title: "اعطني وصفة دولمة", subtitle: "أكلة عراقية أصيلة" },
];

function Index() {
  const [input, setInput] = useState("");
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const modelRef = useRef(modelId);
  modelRef.current = modelId;

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ model: modelRef.current }),
    }),
  ).current;
  const { messages, sendMessage, status, error } = useChat({ transport });

  const activeModel = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  const isLoading = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, []);

  const handleSubmit = (message: { text?: string }) => {
    const text = (message.text ?? input).trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    sendMessage({ text });
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="orb size-[520px]" style={{ background: "var(--gradient-orb-1)", top: "-10%", right: "-10%" }} />
        <div className="orb size-[480px]" style={{ background: "var(--gradient-orb-2)", bottom: "-15%", left: "-10%", animationDelay: "-6s" }} />
        <div className="orb size-[360px]" style={{ background: "var(--gradient-orb-3)", top: "30%", left: "30%", animationDelay: "-12s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.22_0.06_290_/_0.6),_transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="glass relative z-10 flex items-center justify-between px-5 py-3 border-b border-border/40 rounded-none">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={abosyLogo} alt="عبوسي" width={36} height={36} className="size-9 rounded-xl" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-base font-semibold tracking-tight">عبوسي</h1>
            <span className="text-[11px] text-muted-foreground">مساعد عراقي ذكي</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:bg-white/[0.10] focus:outline-none focus:ring-2 focus:ring-primary/40">
              <span className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-primary-foreground">
                {activeModel.icon}
              </span>
              <span>{activeModel.name}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="glass-strong min-w-[260px] rounded-2xl border-white/15 p-1.5 text-right"
            >
              {MODELS.map((m) => {
                const selected = m.id === modelId;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onSelect={() => setModelId(m.id)}
                    className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-right focus:bg-white/10"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-xs font-bold text-primary-foreground">
                      {m.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        {selected && <Check className="size-4 text-primary" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{m.description}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Conversation */}
      <Conversation className="relative z-10 flex-1 [&_[data-slot=conversation-content]]:mx-auto [&_[data-slot=conversation-content]]:max-w-3xl [&_[data-slot=conversation-content]]:px-4 [&_[data-slot=conversation-content]]:py-6">
        <ConversationContent>
          {isEmpty ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in-up">
              <img src={abosyLogo} alt="عبوسي" width={96} height={96} className="size-24 drop-shadow-[0_0_30px_oklch(0.74_0.18_295_/_0.5)]" />
              <h2 className="mt-6 text-3xl font-bold tracking-tight">
                هلا وغلا، آني <span className="text-gradient">عبوسي</span>
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                مساعدك العراقي الذكي. اسألني بأي شي يخطر ببالك — شعر، فقه، كود، أو حجي.
              </p>
              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => handleSuggestion(s.title)}
                    className="glass group rounded-2xl p-4 text-right transition-all hover:bg-white/[0.10] hover:border-white/20 hover:-translate-y-0.5"
                  >
                    <div className="text-sm font-medium text-foreground">{s.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                return (
                  <Message from={m.role} key={m.id} className="animate-fade-in-up">
                    {m.role === "assistant" ? (
                      <div className="max-w-[85%] text-[15px] leading-relaxed text-foreground">
                        <MessageResponse>{text}</MessageResponse>
                      </div>
                    ) : (
                      <MessageContent className="max-w-[80%] rounded-2xl rounded-tl-md bg-primary/90 px-4 py-2.5 text-primary-foreground shadow-[0_4px_20px_oklch(0.74_0.18_295_/_0.25)]">
                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>
                      </MessageContent>
                    )}
                  </Message>
                );
              })}
              {status === "submitted" && (
                <div className="px-2 py-3">
                  <Shimmer>عبوسي يفكر...</Shimmer>
                </div>
              )}
              {error && (
                <div className="mx-auto mt-3 max-w-md rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive-foreground">
                  صار خطأ. حاول مرة ثانية.
                </div>
              )}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Composer */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-5 pt-2">
        <PromptInput
          onSubmit={handleSubmit}
          className="glass-strong rounded-3xl !border-white/15 overflow-hidden focus-within:!border-primary/50 focus-within:shadow-[0_0_0_3px_oklch(0.74_0.18_295_/_0.15)] transition-all"
        >
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك لعبوسي..."
            className="!bg-transparent !text-[15px] placeholder:text-muted-foreground/60"
          />
          <PromptInputFooter className="justify-end px-2 pb-2">
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() || isLoading}
              className="rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_4px_20px_oklch(0.74_0.18_295_/_0.4)] hover:opacity-90"
            />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
          عبوسي ممكن يخطئ — تأكد من المعلومات المهمة.
        </p>
      </div>
    </div>
  );
}
