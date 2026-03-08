import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gizlilik Politikası (KVKK) / Privacy Policy",
    description: "Scrutix Gizlilik Politikası ve KVKK aydınlatma metni. / Privacy Policy and GDPR/KVKK compliance text for Scrutix."
};

export default function PrivacyPage() {
    return (
        <div className="container max-w-4xl py-12 px-4 md:px-8">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4">
                Gizlilik Politikası (KVKK) <span className="text-muted-foreground font-normal">/ Privacy Policy</span>
            </h1>

            <div className="space-y-12">
                {/* Turkish Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary">TR: Gizlilik ve Kişisel Verilerin Korunması</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                        <p>
                            Aksine açıkça izin verilmedikçe, Scrutix platformu hiçbir ziyaretçimizin kişisel kimlik bilgilerini (ad, soyad, TC kimlik no vb.) <strong>toplamaz ve saklamaz.</strong> Sistemimiz tamamen anonim web trafiği analitiği üzerinden çalışır. Türkiye Cumhuriyeti 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında sorumluluklarımızın bilincindeyiz.
                        </p>
                        <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Çerezler (Cookies) ve Veri Kullanımı</h3>
                        <p>
                            Scrutix, yalnızca <strong>zorunlu çalışma çerezlerini</strong>, kullanıcı oturum durumlarını ve tercih edilen renk temalarını kaydetmek amacıyla çerez kullanır. Örneğin, üst kısımdaki &quot;Yasal Uyarı&quot; banner&apos;ını gizlemek için tarayıcınıza maksimum 30 gün süreli, anonim bir bilgilendirme çerezi bırakılır.
                        </p>
                        <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Üçüncü Taraf İşlemciler</h3>
                        <p>
                            Performans değerlendirmesi ve güvenlik amacıyla anonim analitik sağlayıcılar kullanılabilir. Bu platformlar yalnızca IP adreslerinin maskelenmiş türevlerini veya kaba lokasyonları (Ağ verisi hızı, sayfa yüklenme süreleri vb.) izleyerek Core Web Vitals optimizasyonumuza katkıda bulunur.
                        </p>
                    </div>
                </section>

                <hr className="border-muted border-t-2" />

                {/* English Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary">EN: Privacy Policy & Data Protection</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                        <p>
                            Unless explicitly authorized, the Scrutix platform <strong>does not collect or store</strong> any personally identifiable information (PII) of our visitors (such as name, surname, national ID, etc.). Our system operates entirely on anonymous web traffic analytics. We are fully aware of our responsibilities under global and local data protection laws (including GDPR and KVKK).
                        </p>
                        <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Cookies and Data Usage</h3>
                        <p>
                            Scrutix uses cookies <strong>strictly for essential operations</strong>, maintaining user session states, and saving preferred color themes. For instance, to hide the top &quot;Legal Disclaimer&quot; banner, an anonymous informational cookie is stored in your browser with a maximum lifespan of 30 days.
                        </p>
                        <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Third-Party Processors</h3>
                        <p>
                            Anonymous analytics providers may be utilized for performance evaluation and security purposes. These platforms contribute to our Core Web Vitals optimization by tracking only masked derivatives of IP addresses or rough location data (e.g., network speed, page load times).
                        </p>
                    </div>
                </section>
            </div>

            <div className="mt-12 text-sm text-center text-muted-foreground bg-muted p-4 rounded-lg">
                <p>Son Güncelleme / Last Updated: 08.03.2026</p>
            </div>
        </div>
    );
}
