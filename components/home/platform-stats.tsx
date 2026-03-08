import { BarChart3, Users, Vote, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PlatformStats() {
    const stats = [
        {
            label: "Analiz Edilen Secim",
            value: "14",
            icon: <Vote className="h-5 w-5 text-primary" />,
        },
        {
            label: "Anket Firmasi",
            value: "42",
            icon: <BarChart3 className="h-5 w-5 text-secondary" />,
        },
        {
            label: "Toplam Anket Verisi",
            value: "850+",
            icon: <Database className="h-5 w-5 text-primary" />,
        },
        {
            label: "Aktif Tahminci",
            value: "12K+",
            icon: <Users className="h-5 w-5 text-secondary" />,
        },
    ];

    return (
        <section className="py-8 border-y bg-muted/20 my-12">
            <div className="container">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {stats.map((stat, i) => (
                        <Card key={i} className="bg-transparent border-none shadow-none">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <div className="p-3 bg-background rounded-full border shadow-sm flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-3xl font-bold tracking-tighter">{stat.value}</h4>
                                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
