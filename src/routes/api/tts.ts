import { createFileRoute } from "@tanstack/react-router";

type TtsBody = { text?: string; voice?: string };

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice } = (await request.json()) as TtsBody;
        if (!text || typeof text !== "string") {
          return new Response("text is required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Cap input length defensively to avoid 400 from the model.
        const input = text.slice(0, 4000);

        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input,
              voice: voice || "alloy",
              stream_format: "sse",
              response_format: "pcm",
              instructions:
                "Speak in clear Arabic with a warm, natural Iraqi-Baghdadi accent, calm and friendly tone.",
            }),
            signal: request.signal,
          });

          if (!upstream.ok) {
            const msg = await upstream.text().catch(() => "");
            return new Response(`TTS failed: ${upstream.status} ${msg}`, {
              status: upstream.status,
            });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw err;
        }
      },
    },
  },
});