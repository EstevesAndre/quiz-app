"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

type UploadedItem = {
  fileName: string;
  url: string;
};

type UploadImageHelperProps = {
  title?: string;
  description?: string;
};

export function UploadImageHelper({
  title = "Upload rápido para JSON",
  description = "Faz upload imediato e copia o URL gerado para colar no campo de imagem.",
}: UploadImageHelperProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const nextUploadedItems: UploadedItem[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const responseBody = (await response.json()) as {
          url?: string;
          error?: string;
        };
        if (!response.ok || !responseBody.url) {
          throw new Error(responseBody.error || "Falha no upload.");
        }

        nextUploadedItems.push({
          fileName: file.name,
          url: responseBody.url,
        });
      }

      setUploadedItems((currentItems) => [
        ...nextUploadedItems,
        ...currentItems,
      ]);
      event.target.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no upload.");
    } finally {
      setIsUploading(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError("Não foi possível copiar o URL.");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">{description}</p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        disabled={isUploading}
        multiple
        className="block w-full text-sm"
      />

      {isUploading ? <p className="text-xs">A carregar imagem...</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {uploadedItems.length > 0 ? (
        <div className="space-y-2">
          {uploadedItems.map((item) => (
            <div
              key={`${item.url}-${item.fileName}`}
              className="flex items-center justify-between gap-3 rounded-md bg-muted px-2 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-background">
                  <Image
                    src={item.url}
                    alt={item.fileName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.fileName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.url}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => copyUrl(item.url)}
              >
                Copiar URL
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
