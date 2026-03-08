"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center justify-center gap-6 py-20">
      <h1 className="text-4xl font-bold text-destructive">Bir Hata Olustu</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Beklenmeyen bir hata meydana geldi. Lutfen tekrar deneyin.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">
          Hata kodu: {error.digest}
        </p>
      )}
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  );
}
