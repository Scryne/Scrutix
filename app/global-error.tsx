"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold">Beklenmeyen bir hata olustu</h2>
          <p className="text-muted-foreground max-w-md">
            Bir sorun olustu. Lutfen sayfayi yenileyin veya daha sonra tekrar deneyin.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
