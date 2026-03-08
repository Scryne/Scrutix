import { Info } from "lucide-react";

interface PredictionDisclaimerProps {
    className?: string;
}

export function PredictionDisclaimer({ className = "" }: PredictionDisclaimerProps) {
    return (
        <div className={`flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/40 border ${className}`}>
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <div className="flex flex-col gap-0.5">
                <p><strong>TR:</strong> Bu bir olasılık tahminidir, kehanet değil.</p>
                <p className="opacity-80"><strong>EN:</strong> This is a probability forecast, not a prophecy.</p>
            </div>
        </div>
    );
}
