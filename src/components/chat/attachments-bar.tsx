import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { X, FileText } from "lucide-react";

export function AttachmentsBar() {
  const { files, remove } = usePromptInputAttachments();
  if (files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {files.map((f) => {
        const isImage = f.mediaType?.startsWith("image/");
        return (
          <div
            key={f.id}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
          >
            {isImage ? (
              <img
                src={f.url}
                alt={f.filename ?? "attachment"}
                className="size-16 object-cover"
              />
            ) : (
              <div className="flex size-16 flex-col items-center justify-center gap-1 px-2 text-center">
                <FileText className="size-5 text-muted-foreground" />
                <span className="line-clamp-1 text-[10px] text-muted-foreground">
                  {f.filename}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="إزالة"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}