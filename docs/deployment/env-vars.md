# 🌐 Production Environment Variables

Bu doküman, projeyi Vercel'de production ortamına deploy ederken ayarlanması gereken environment değişkenlerini barındırır. Vercel dashboard üzerinden projeye girip `Settings > Environment Variables` kısmından bunları üretim (Production) ortamı için doldurmalısınız.

## 🗄️ Database (Supabase)

Supabase veritabanınızı bağlarken Prisma'nın daha sağlıklı çalışması için Connection Pooling (PgBouncer) kullanmalısınız.

```env
# Doğrudan connection URL (Migrations için gerekli olabilir, örn: prisma migrate deploy)
DIRECT_URL="postgres://postgres.[PROJE_ID]:[SIFRE]@aws-0-[BOLGE].pooler.supabase.com:5432/postgres"

# PgBouncer Connection Pool URL (Transaction (6543) üzerinden bağlanmalı ve ?pgbouncer=true parametresi içermelidir)
DATABASE_URL="postgres://postgres.[PROJE_ID]:[SIFRE]@aws-0-[BOLGE].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Feature Flags için Edge Config. (Vercel Edge Configs bölümünden bağlanacak)
EDGE_CONFIG="https://edge-config.vercel.com/..."
```

## 🔐 Auth (NextAuth/Auth.js)

```env
# Üretilen rastgele NextAuth secret'i. (openssl rand -base64 32 ile üretin)
NEXTAUTH_SECRET="..."

# Vercel projenizin domain adresi, üretimdeki kök URL (örn: https://www.scrutix.com)
NEXTAUTH_URL="https://[YOUR_PRODUCTION_DOMAIN]"
```

## 📈 Monitoring & Analytics (Sentry)

Vercel Sentry entegrasyonu kurulduğunda bu değişkenler otomatik yüklenebilir, veya Vercel Settings'ten manuel eklenmelidir.

```env
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
SENTRY_AUTH_TOKEN="..."
```

## ⚙️ CI/CD (GitHub Secrets)

.github/workflows/deploy.yml in çalışması için GitHub `Settings > Secrets and variables > Actions` içinde şu valueler tanımlı olmalıdır:

- `VERCEL_TOKEN`: Vercel profilinizden alınmış Personal Access Token.
- `VERCEL_ORG_ID`: Vercel proje/organizasyon ID'si.
- `VERCEL_PROJECT_ID`: Vercel proje ID'si.
