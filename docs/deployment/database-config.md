# 📊 Database Server Configuration (Supabase) & Monitoring

Projeyi production'a çıkartırken veri kaybını önlemek, performansı maxlamak ve downtime takibini yapabilmek adına Supabase ve Monitoring uygulamalarında yapılacak ayarlar:

## 1. Connection Pooling (PgBouncer)

Vercel gibi Serverless ortamlardan veritabanına gelen onbinlerce anlık bağlantı, veritabanını dondurabilir. Bu nedenle Supabase üzerinde **PgBouncer** havuzu kullanılmalıdır.

* **Supabase Dashboard** -> Project Settings -> Database -> Connection Pooling sekmesine gidin.
* `Pool Mode`: `Transaction` olduğundan emin olun.
* `Port`: 6543
* Alınan uri'nin sonuna Prisma uyumu için `?pgbouncer=true` eklendiğine emin olup Vercel env'sine girin.

## 2. Row Level Security (RLS) Etkinleştirme

Supabase Dashboard üzerinden tüm kritik tablolara (kullanıcılar, anketler vb.) RLS uygulandığından emin olun.
* Production veritabanında `Enable RLS` tuşlarına basılmış olması gerekmektedir.
* API key'in ifşa olması durumunda verilerin doğrudan API üzerinden silinmesini önleyecektir. Backend Prisma zaten Admin yetkisiyle işlemlerini yapıyor.

## 3. Database Yedeklemeleri (Backups)

Supabase Pro veya üstü planlarında Daily Backup (Günlük Yedekleme) otomatik aktiftir.

* **Dashboard -> Database -> Backups** sayfasından PITR (Point in Time Recovery) gerektiren çok kritik projeler için PITR Addon açılması tavsiye edilir. 
* Pro planda değilseniz Vercel Cron (`/api/cron/db-backup`) kullanılarak periyodik bir Supabase Edge Function çağırıp `pg_dump` yapan custom bir workflow kurulabilir. Vercel.json içerisine `0 3 * * *` (Her gece 03:00) şeklinde cron eklenmiştir.

## 4. Uptime Monitoring (Better Uptime veya UptimeRobot)

Platformun yayında olduğunu sürekli izlemek için bir Monitoring tool'u kurmak zorunludur.

* UptimeRobot üzerinden "HTTP(s)" monitor oluşturun.
* Endpoint olarak uygulamanızın ana URL'sini (`https://www.scrutix.com`) ve ideal olarak Next.js API'sindeki bir Health check endpointini verin. (`/api/health`)
* Her 1 dakikada bir ping atmasını sağlayarak kesinti (downtime) yaşanması durumunda Slack veya Email webhook'u üzerinden teknik ekibe bildirim gönderilmesini sağlayın.
