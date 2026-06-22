import type { FileUIPart } from "ai";

async function blobUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function inlineFilePartUrls(
  files: (FileUIPart & { id?: string })[],
): Promise<FileUIPart[]> {
  return await Promise.all(
    files.map(async (f) => {
      const url = f.url.startsWith("blob:") ? await blobUrlToDataUrl(f.url) : f.url;
      return {
        type: "file" as const,
        url,
        mediaType: f.mediaType,
        filename: f.filename,
      };
    }),
  );
}