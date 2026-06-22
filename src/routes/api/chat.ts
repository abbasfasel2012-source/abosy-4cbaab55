import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { SYSTEM_PROMPT } from "@/lib/persona.server";
import { resolveModelId } from "@/lib/models";
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type CoreMessage } from "ai";

type ChatRequestBody = { messages?: unknown; model?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ChatRequestBody;
          const { messages, model: requestedModel } = body;
          
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            console.error("LOVABLE_API_KEY is missing");
            return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          }

          const gateway = createLovableAiGatewayProvider(key);
          const modelId = resolveModelId(typeof requestedModel === "string" ? requestedModel : "auto");
          const model = gateway(modelId);
          
          // Robust conversion to CoreMessage
          const coreMessages: CoreMessage[] = messages.map((m: any) => {
            let content = "";
            if (m.content) {
              content = m.content;
            } else if (Array.isArray(m.parts)) {
              content = m.parts.map((p: any) => p.text || "").join("");
            }
            
            return {
              role: m.role === 'user' ? 'user' : 'assistant',
              content: content || " " // Ensure content is never truly empty
            };
          });

          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: coreMessages,
            temperature: 0.8,
          });

          return result.toDataStreamResponse();
        } catch (error) {
          console.error("Chat API Error:", error);
          return new Response(String(error), { status: 500 });
        }
      },
    },
  },
});
