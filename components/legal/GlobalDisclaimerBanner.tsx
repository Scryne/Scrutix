"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalDisclaimerBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Cookie kontrolü (30 günlük 'Anladım' tıklandıysa banner'ı gizle)
        const isDismissed = document.cookie.includes("scrutix_disclaimer_dismissed=true");
        if (!isDismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        // 30 günlük cookie oluştur
        const date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
        document.cookie = `scrutix_disclaimer_dismissed=true; expires=${date.toUTCString()}; path=/`;
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="bg-yellow-100 border-b border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
            <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                    <div className="text-sm font-medium text-yellow-900 dark:text-yellow-200 flex flex-col gap-1">
                        <p>
                            <strong>TR:</strong> Scrutix istatistiksel tahminler sunar. Kesin seçim sonucu öngöremez. Tüm veriler kamuya açık kaynaklardan alınmıştır.
                        </p>
                        <p className="opacity-80">
                            <strong>EN:</strong> Scrutix provides statistical forecasts. It cannot predict exact election results. All data is sourced from public records.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismiss}
                    className="shrink-0 bg-yellow-50 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-800/50 dark:hover:bg-yellow-800 dark:border-yellow-600 dark:text-yellow-100"
                >
                    <X className="h-4 w-4 mr-2" />
                    Anladım / Got it
                </Button>
            </div>
        </div>
    );
}
