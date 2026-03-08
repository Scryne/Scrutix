import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sorumluluk Reddi / Disclaimer",
    description: "Scrutix istatistiksel tahmin modellerinin hukuki sorumluluk reddi beyanı. / Legal disclaimer for Scrutix statistical prediction models."
};

export default function DisclaimerPage() {
    return (
        <div className="container max-w-4xl py-12 px-4 md:px-8">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4">
                Sorumluluk Reddi <span className="text-muted-foreground font-normal">/ Disclaimer</span>
            </h1>

            <div className="space-y-12">
                {/* Turkish Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary">TR: Yasal Sorumluluk Reddi Beyanı</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                        <p>
                            Scrutix tarafından sağlanan tüm istatistiksel tahminler, modelleme sonuçları, anket analizleri ve sentezler tamamen <strong>bilgilendirme, akademik inceleme ve genel kamuoyu analizi</strong> amacıyla sunulmaktadır. Platformumuz yalnızca kamuya açık verileri, resmi seçim geçmişlerini ve yasal anket firmalarının yayınlarını baz alarak çalışır.
                        </p>
                        <p>
                            Platformumuz üzerinden gösterilen %95 güven aralığındaki veya varyans düzeyindeki tüm veriler <strong>kesin bir sonuç beyanı ya da kehanet değildir.</strong> Scrutix; yayınlanan anket ortalamalarının veya model çıktılarının mutlak doğruluğunu ve sandıkta doğrudan gerçekleşeceğini hukuken ya da fiilen garanti etmez, taahhütte bulunmaz.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li><strong>Bağımsızlık:</strong> Scrutix hiçbir siyasi oluşum, parti, aday veya şirket ile organik ya da inorganik bağa sahip değildir. Çalışmalar tamamen tarafsız istatistik modellerine dayanır.</li>
                            <li><strong>Kullanıcı Riski:</strong> Web sitemiz, mobil platformlarımız ya da sosyal medya hesaplarımız üzerinden ulaştığınız bu verilere dayanarak alacağınız her türlü ticari, siyasi, stratejik veya finansal kararların tüm yasal ve maddi sorumluluğu şahsınıza veya kurumunuza aittir.</li>
                            <li><strong>Feragatname:</strong> Scrutix, platformdaki bilgilerin kullanımından kaynaklanabilecek doğrudan veya dolaylı maddi/manevi hiçbir zarardan yasal olarak sorumlu tutulamaz.</li>
                        </ul>
                    </div>
                </section>

                <hr className="border-muted border-t-2" />

                {/* English Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary">EN: Legal Disclaimer</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                        <p>
                            All statistical forecasts, modeling results, poll analyses, and syntheses provided by Scrutix are intended solely for <strong>informational, academic review, and general public analysis</strong> purposes. Our platform operates strictly based on publicly available data, official election histories, and publications from legally registered polling firms.
                        </p>
                        <p>
                            Any data displayed with a 95% confidence interval or variance level on our platform <strong>is not a declaration of absolute outcome or prophecy.</strong> Scrutix does not legally or practically guarantee or commit to the absolute accuracy of published poll averages or model outputs, nor that they will directly materialize in the ballot box.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li><strong>Independence:</strong> Scrutix has no organic or inorganic affiliation with any political entity, party, candidate, or corporation. Our operations rely entirely on impartial statistical models.</li>
                            <li><strong>User Risk:</strong> Any commercial, political, strategic, or financial decisions you make based on data accessed through our website, mobile platforms, or social media accounts are entirely your personal or institutional legal and financial responsibility.</li>
                            <li><strong>Waiver:</strong> Scrutix cannot be held legally liable for any direct or indirect, material or moral damages that may arise from the use of the information on this platform.</li>
                        </ul>
                    </div>
                </section>
            </div>

            <div className="mt-12 text-sm text-center text-muted-foreground bg-muted p-4 rounded-lg">
                <p>Son Güncelleme / Last Updated: 08.03.2026</p>
            </div>
        </div>
    );
}
