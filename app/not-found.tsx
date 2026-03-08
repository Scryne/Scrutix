import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center gap-6 py-20">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-2xl font-semibold">Sayfa Bulunamadi</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Aradiginiz sayfa mevcut degil veya tasinmis olabilir.
      </p>
      <Button asChild>
        <Link href="/">Ana Sayfaya Don</Link>
      </Button>
    </div>
  );
}
