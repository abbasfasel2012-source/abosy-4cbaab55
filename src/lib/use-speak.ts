import { useCallback, useRef, useState } from "react";
import { createParser } from "eventsource-parser";

type SpeakStatus = "idle" | "loading" | "speaking";

export function useSpeak() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<SpeakStatus>("idle");
  const ctxRef = useRef<AudioContext | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    sourcesRef.current = [];
    setStatus("idle");
    setActiveId(null);
  }, []);

  const speak = useCallback(
    async (id: string, text: string) => {
      if (activeId === id) {
        stop();
        return;
      }
      stop();
      setActiveId(id);
      setStatus("loading");

      if (!ctxRef.current) {
        ctxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") await ctx.resume().catch(() => {});

      let playhead = 0;
      let pending = new Uint8Array(0);

      const playChunk = (incoming: Uint8Array) => {
        const bytes = new Uint8Array(pending.length + incoming.length);
        bytes.set(pending);
        bytes.set(incoming, pending.length);
        const usable = bytes.length - (bytes.length % 2);
        pending = bytes.slice(usable);
        if (usable === 0) return;
        const samples = new Int16Array(bytes.buffer, 0, usable / 2);
        const floats = Float32Array.from(samples, (s) => s / 32768);
        const buffer = ctx.createBuffer(1, floats.length, 24000);
        buffer.copyToChannel(floats, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        if (playhead === 0) {
          playhead = ctx.currentTime + 0.05;
          setStatus("speaking");
        } else {
          playhead = Math.max(playhead, ctx.currentTime);
        }
        source.start(playhead);
        playhead += buffer.duration;
        sourcesRef.current.push(source);
      };

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: abort.signal,
        });
        if (!res.ok || !res.body) throw new Error(`TTS ${res.status}`);

        const parser = createParser({
          onEvent(event) {
            let payload: { type?: string; audio?: string };
            try {
              payload = JSON.parse(event.data);
            } catch {
              return;
            }
            if (payload.type !== "speech.audio.delta" || !payload.audio) return;
            const binary = atob(payload.audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            playChunk(bytes);
          },
        });

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.feed(value);
        }

        // Reset status when last scheduled source finishes
        const last = sourcesRef.current[sourcesRef.current.length - 1];
        if (last) {
          last.onended = () => {
            if (abortRef.current === abort) {
              setStatus("idle");
              setActiveId(null);
              abortRef.current = null;
            }
          };
        } else {
          setStatus("idle");
          setActiveId(null);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
        }
        setStatus("idle");
        setActiveId(null);
      }
    },
    [activeId, stop],
  );

  return { speak, stop, activeId, status };
}