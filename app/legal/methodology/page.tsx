import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Metodoloji ve Sınırlamalar / Methodology & Limitations",
    description: "Scrutix tahmin modelinin istatistiksel sınırları. / Statistical limitations of the Scrutix prediction model."
};

export default function MethodologyPage() {
    return (
        <div className="container max-w-4xl py-12 px-4 md:px-8">
            <h1 className="text-3xl font-bold mb-8 border-b pb-4">
                Model Sınırlamaları <span className="text-muted-foreground font-normal">/ Model Limitations</span>
            </h1>

            <div className="space-y-12">
                {/* Turkish Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary">TR: İstatistiksel Sınırlar Nelerdir?</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                        <p>
                            Scrutix algoritmik yapısı; geç yayınlanma sapması, anket firmalarının yanlılığı ve dar bölgelerdeki veri kirliliğinden arındırılmış, normalize bir sonuç çıkartmayı amaçlar. Ancak şeffaflık ilkemiz gereği modelin temel istatistiksel <strong>sınırlamalarını ve zaaflarını</strong> beyan ediyoruz.
                        </p>
                        <ul className="grid gap-6 mt-6">
                            <li className="bg-muted/50 p-5 rounded-lg border">
                                <h4 className="font-bold text-foreground text-lg mb-2">1. Ani Krizlerin Anlık Etkisi (Lag Effect)</h4>
                                <p className="text-sm">Model sonuçları, büyük ölçekli jeopolitik veya sosyal krizlerin hemen ardından anlık olarak değişemez. Zira sahadaki etki ancak 3-7 gün sonra kamuoyu araştırmalarına yansıtılır.</p>
                            </li>
                            <li className="bg-muted/50 p-5 rounded-lg border">
                                <h4 className="font-bold text-foreground text-lg mb-2">2. Katılım Oranı Değişkenliği</h4>
                                <p className="text-sm">Mevcut modelimiz, farklı seçmen gruplarının seçim günü sandığa devasa oranlarda asimetrik veya eksik gitmesini mutlak bir doğrulukla öngöremez. Geniş çaplı boykotlar marjları şiddetle saptırabilir.</p>
                            </li>
                            <li className="bg-muted/50 p-5 rounded-lg border">
                                <h4 className="font-bold text-foreground text-lg mb-2">3. Dar Bölgelerde Yüksek Varyans</h4>
                                <p className="text-sm">Büyükşehirler ve ülke geneli sonuçlar hata payı içinde kalırken; milletvekili/belediye başkanı sayısının düşük olduğu mikro seçim çevrelerinde, örneklem yetersizliğinden dolayı model çok daha geniş bir %95 güven aralığı hesaplar.</p>
                            </li>
                        </ul>
                    </div>
                </section>

                <hr className="border-muted border-t-2" />

                {/* English Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-primary">EN: What Are the Statistical Limits?</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
                        <p>
                            The Scrutix algorithmic structure aims to produce a normalized result, filtered from late-publishing deviation, polling firm bias, and data pollution in narrow regions. However, in accordance with our principle of transparency, we declare the <strong>core statistical limitations and vulnerabilities</strong> of the model.
                        </p>
                        <ul className="grid gap-6 mt-6">
                            <li className="bg-muted/50 p-5 rounded-lg border">
                                <h4 className="font-bold text-foreground text-lg mb-2">1. The Lag Effect of Sudden Crises</h4>
                                <p className="text-sm">Model results cannot change instantly following large-scale geopolitical or social crises. The on-ground impact is only reflected in public surveys 3-7 days later.</p>
                            </li>
                            <li className="bg-muted/50 p-5 rounded-lg border">
                                <h4 className="font-bold text-foreground text-lg mb-2">2. Turnout Variability</h4>
                                <p className="text-sm">Our current model cannot predict with absolute accuracy massive asymmetrical or missing turnout of different voter bases on election day. Large-scale boycotts can severely skew the margins.</p>
                            </li>
                            <li className="bg-muted/50 p-5 rounded-lg border">
                                <h4 className="font-bold text-foreground text-lg mb-2">3. High Variance in Narrow Districts</h4>
                                <p className="text-sm">While metropolitan and nationwide results remain within the margin of error; in micro-election districts with low representative counts, the model calculates a much wider 95% confidence interval due to insufficient sampling data.</p>
                            </li>
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
