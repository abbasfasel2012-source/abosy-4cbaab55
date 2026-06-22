import { SYSTEM_PROMPT } from "@/lib/persona.server";
import { createFileRoute } from "@tanstack/react-router";

type ChatRequestBody = { messages?: any[]; model?: string };

const BLINK_PROJECT_ID = 'abosy-mobile-chat-yi0lf6tr';
const BLINK_SECRET_KEY = 'blnk_sk_yi0lf6tr_XACN3bpbXm5cCFrgzrhI5ic42ssMq1BX';

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

          // Format messages for Blink API
          // Blink usually expects a prompt or a specific format. 
          // Based on the SDK, we'll try to use their chat completion endpoint if available, 
          // or simulate it via their gateway.
          
          const lastMessage = messages[messages.length - 1]?.content || "";

          const response = await fetch(`https://ai.gateway.lovable.dev/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${BLINK_SECRET_KEY}`,
              'Lovable-Project-Id': BLINK_PROJECT_ID
            },
            body: JSON.stringify({
              model: "gpt-4o", // Default working model from Blink
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages.map(m => ({
                  role: m.role === 'user' ? 'user' : 'assistant',
                  content: m.content
                }))
              ],
              stream: true
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Blink API Error:", errorText);
            return new Response(`Blink API Error: ${errorText}`, { status: response.status });
          }

          // Return the stream directly
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
