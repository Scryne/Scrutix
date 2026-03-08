"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionDisclaimer } from "@/components/legal/PredictionDisclaimer";

export interface PredictionGaugeProps {
    title?: string;
    description?: string;
    value: number; // 0-100
    isLoading?: boolean;
}

export function PredictionGauge({
    title = "Kazanma Olasılığı",
    description,
    value,
    isLoading = false,
}: PredictionGaugeProps) {
    if (isLoading) {
        return (
            <Card className="w-full h-full flex flex-col">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center">
                    <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </CardContent>
            </Card>
        );
    }

    // Ensure value is between 0 and 100
    const normalizedValue = Math.min(Math.max(value, 0), 100);

    // Determine color based on ranges
    // 0-40: Red (#ef4444)
    // 40-60: Yellow (#eab308)
    // 60-100: Green (#22c55e)
    let fillColor = "#ef4444";
    if (normalizedValue >= 60) {
        fillColor = "#22c55e"; // green
    } else if (normalizedValue >= 40) {
        fillColor = "#eab308"; // yellow
    }

    const data = [
        { name: "Değer", value: normalizedValue },
        { name: "Kalan", value: 100 - normalizedValue }, // The rest of the gauge
    ];

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="relative flex-1 flex flex-col items-center justify-center">
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="75%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius="70%"
                                outerRadius="100%"
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={true}
                                animationBegin={0}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                <Cell fill={fillColor} />
                                <Cell fill="var(--muted)" opacity={0.5} />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center pb-4">
                        <span className="text-5xl font-bold tracking-tighter" style={{ color: fillColor }}>
                            %{normalizedValue.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground mt-1 font-medium">İhtimal</span>
                    </div>
                </div>
                <div className="mt-6 w-full mt-auto">
                    <PredictionDisclaimer />
                </div>
            </CardContent>
        </Card>
    );
}
