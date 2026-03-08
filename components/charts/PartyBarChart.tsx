"use client";

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

export interface PartyBarDataPoint {
    partyId: string;
    partyName: string;
    color: string;
    // e.g., "Son Anket", "Önceki Anket 1", "Önceki Anket 2"
    poll1: number;
    poll2?: number;
    poll3?: number;
}

export interface PartyBarChartProps {
    title?: string;
    description?: string;
    data: PartyBarDataPoint[];
    pollLabels?: {
        poll1: string;
        poll2?: string;
        poll3?: string;
    };
    isLoading?: boolean;
}

export function PartyBarChart({
    title = "Parti Oy Oranları Karşılaştırması",
    description,
    data,
    pollLabels = { poll1: "Son Anket", poll2: "Önceki Anket 1", poll3: "Önceki Anket 2" },
    isLoading = false,
}: PartyBarChartProps) {
    // Sort data so the party with the highest latest poll is on top (which is bottom in Recharts vertical layout without reversed, so we reverse it)
    const sortedData = [...data].sort((a, b) => a.poll1 - b.poll1);

    if (isLoading) {
        return (
            <Card className="w-full h-full">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-5/6" />
                        <Skeleton className="h-8 w-4/6" />
                        <Skeleton className="h-8 w-3/4" />
                    </div>
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
                    <p>Yeterli anket verisi bulunamadı.</p>
                </CardContent>
            </Card>
        );
    }

    const hasPoll2 = sortedData.some((d) => d.poll2 !== undefined);
    const hasPoll3 = sortedData.some((d) => d.poll3 !== undefined);

    return (
        <Card className="w-full h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sortedData}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                            <XAxis
                                type="number"
                                domain={[0, "auto"]}
                                tickFormatter={(val) => `%${val}`}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                dataKey="partyName"
                                type="category"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-foreground font-medium"
                                width={80}
                            />
                            <Tooltip
                                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                                contentStyle={{
                                    backgroundColor: "var(--background)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    color: "var(--foreground)",
                                }}
                                formatter={(value: number) => [`%${value.toFixed(1)}`, "Oy Oranı"]}
                            />
                            <Legend wrapperStyle={{ paddingTop: "10px" }} />

                            {hasPoll3 && (
                                <Bar dataKey="poll3" name={pollLabels.poll3} radius={[0, 4, 4, 0]}>
                                    {sortedData.map((entry, index) => (
                                        <Cell key={`cell-p3-${index}`} fill={entry.color} fillOpacity={0.4} />
                                    ))}
                                </Bar>
                            )}
                            {hasPoll2 && (
                                <Bar dataKey="poll2" name={pollLabels.poll2} radius={[0, 4, 4, 0]}>
                                    {sortedData.map((entry, index) => (
                                        <Cell key={`cell-p2-${index}`} fill={entry.color} fillOpacity={0.7} />
                                    ))}
                                </Bar>
                            )}
                            <Bar dataKey="poll1" name={pollLabels.poll1} radius={[0, 4, 4, 0]}>
                                {sortedData.map((entry, index) => (
                                    <Cell key={`cell-p1-${index}`} fill={entry.color} fillOpacity={1} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
