import { SYSTEM_PROMPT } from "@/lib/persona.server";
import { createFileRoute } from "@tanstack/react-router";

type ChatRequestBody = { messages?: any[]; model?: string };

// These keys are from your working "abosy-ai" repo
const BLINK_PROJECT_ID = 'abosy-mobile-chat-yi0lf6tr';
const BLINK_PUBLISHABLE_KEY = 'blnk_pk_ijA5gysI3IVoOJ63lysGn-Um04464qr7';

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ChatRequestBody;
          const { messages } = body;
          
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          // We use the Lovable AI Gateway which supports Blink projects
          const response = await fetch(`https://ai.gateway.lovable.dev/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Lovable-API-Key': BLINK_PUBLISHABLE_KEY, // Using the publishable key as the API key for the gateway
            },
            body: JSON.stringify({
              model: "gpt-4o", 
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages.map(m => ({
                  role: m.role === 'user' ? 'user' : 'assistant',
                  content: m.content || (Array.isArray(m.parts) ? m.parts.map((p: any) => p.text || "").join("") : "")
                }))
              ],
              stream: true
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Blink Gateway Error:", errorText);
            return new Response(`AI Error: ${errorText}`, { status: response.status });
          }

          return new Response(response.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });

        } catch (error) {
          console.error("Chat API Error:", error);
          return new Response(String(error), { status: 500 });
        }
      },
    },
  },
});
