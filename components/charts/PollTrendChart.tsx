"use client";

import React, { useMemo } from "react";
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

export interface PollTrendDataPoint {
    date: string; // e.g., "2024-01-01"
    [key: string]: string | number | [number, number]; // partyId: value, partyId_ci: [min, max]
}

export interface PartyConfig {
    id: string;
    name: string;
    color: string;
}

export interface PollTrendChartProps {
    title?: string;
    description?: string;
    data: PollTrendDataPoint[];
    parties: PartyConfig[];
    isLoading?: boolean;
}

export function PollTrendChart({
    title = "Anket Trendleri",
    description,
    data,
    parties,
    isLoading = false,
}: PollTrendChartProps) {
    const transformedData = useMemo(() => {
        // We can compute or just pass the data through if it's already properly structured for recharts
        // Recharts Area expects flat [min, max] array or two separate fields for range.
        // If partyId_ci is like `[30.5, 34.2]`, Area will handle it out of the box with dataKey.
        return data;
    }, [data]);

    if (isLoading) {
        return (
            <Card className="w-full h-full">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="w-full h-full">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Info className="h-10 w-10 mb-4 opacity-50" />
                    <p>Gösterilecek veri bulunamadı.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={transformedData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                domain={[0, "auto"]}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `%${val}`}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--background)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    color: "var(--foreground)",
                                }}
                                itemStyle={{ color: "var(--foreground)" }}
                                formatter={(value: number) => {
                                    if (Array.isArray(value)) {
                                        return [`%${value[0]} - %${value[1]}`, "Güven Aralığı"];
                                    }
                                    return [`%${Number(value).toFixed(1)}`, "Oy Oranı"];
                                }}
                                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />

                            {parties.map((party) => (
                                <React.Fragment key={party.id}>
                                    {/* CI Area */}
                                    <Area
                                        type="monotone"
                                        dataKey={`${party.id}_ci`}
                                        fill={party.color}
                                        fillOpacity={0.15}
                                        stroke="none"
                                        name={`${party.name} (GA)`}
                                        legendType="none" // Hide from legend to avoid duplication
                                        isAnimationActive={true}
                                    />
                                    {/* Main Line */}
                                    <Line
                                        type="monotone"
                                        dataKey={party.id}
                                        stroke={party.color}
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: party.color, strokeWidth: 0 }}
                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                        name={party.name}
                                        isAnimationActive={true}
                                    />
                                </React.Fragment>
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
