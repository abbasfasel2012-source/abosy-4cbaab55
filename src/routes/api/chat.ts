import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { SYSTEM_PROMPT } from "@/lib/persona.server";
import { resolveModelId } from "@/lib/models";
import { createFileRoute } from "@tanstack/react-router";
import { streamText, type UIMessage } from "ai";

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
          
          // Robust conversion to UIMessage for toUIMessageStreamResponse
          const formattedMessages = (messages as any[]).map(m => ({
            id: m.id || Math.random().toString(36).substring(7),
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content || (Array.isArray(m.parts) ? m.parts.map((p: any) => p.text || "").join("") : ""),
            parts: m.parts || [{ type: 'text', text: m.content || "" }]
          })) as UIMessage[];

          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: formattedMessages as any, // streamText will handle UIMessage if shaped correctly
            temperature: 0.8,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: formattedMessages,
          });
        } catch (error) {
          console.error("Chat API Error:", error);
          return new Response(String(error), { status: 500 });
        }
      },
    },
  },
});
