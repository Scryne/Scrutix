"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { APP_NAME } from "@/constants";
import type { SessionUser } from "@/types/auth";

interface AdminDashboardProps {
  user: SessionUser;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {APP_NAME} Yonetim Paneli
            </h1>
            <p className="text-muted-foreground mt-1">
              Hos geldiniz, {user.name ?? user.email}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Cikis Yap
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard title="Secimler" value="--" description="Toplam secim kaydi" />
          <DashboardCard title="Anketler" value="--" description="Toplam anket sonucu" />
          <DashboardCard title="Tahminler" value="--" description="Yayinlanmis tahmin" />
          <DashboardCard title="Veri Kaynaklari" value="--" description="Dogrulanmis kaynak" />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Hizli Islemler</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Secim Ekle"
              description="Yeni bir secim kaydi olustur"
              href="/admin/elections/new"
            />
            <ActionCard
              title="Anket Girisi"
              description="Anket sonucu ekle veya guncelle"
              href="/admin/polls/new"
            />
            <ActionCard
              title="Veri Kaynagi Dogrula"
              description="Bekleyen veri kaynaklarini incele"
              href="/admin/data-sources"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="group rounded-lg border bg-card p-6 transition-shadow hover:shadow-md cursor-pointer">
        <h3 className="font-semibold group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </Link>
  );
}
