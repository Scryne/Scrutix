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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

export interface RegionalDataPoint {
    regionName: string; // e.g. "Marmara", "Ege"
    [partyId: string]: string | number;
}

export interface PartyConfig {
    id: string;
    name: string;
    color: string;
}

export interface RegionalChartProps {
    title?: string;
    description?: string;
    data: RegionalDataPoint[];
    parties: PartyConfig[];
    isLoading?: boolean;
}

export function RegionalChart({
    title = "Bölgelere Göre Oy Oranları",
    description,
    data,
    parties,
    isLoading = false,
}: RegionalChartProps) {
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
                    <p>Bölgesel veri bulunamadı.</p>
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
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="regionName"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                                interval={0} // Ensure all regions are visible
                                angle={data.length > 5 ? -45 : 0} // Rotate slightly if there are many labels
                                textAnchor={data.length > 5 ? "end" : "middle"}
                                height={60}
                            />
                            <YAxis
                                domain={[0, "auto"]} // Typically up to 100 or highest cumulative stack
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `%${val}`}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                                contentStyle={{
                                    backgroundColor: "var(--background)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    color: "var(--foreground)",
                                }}
                                itemStyle={{ color: "var(--foreground)" }}
                                formatter={(value: number, name: string) => {
                                    const party = parties.find((p) => p.id === name || p.name === name);
                                    const displayName = party ? party.name : name;
                                    return [`%${Number(value).toFixed(1)}`, displayName];
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />

                            {parties.map((party) => (
                                <Bar
                                    key={party.id}
                                    dataKey={party.id}
                                    name={party.name}
                                    stackId="regional-stack"
                                    fill={party.color}
                                    isAnimationActive={true}
                                    radius={0} // Stacked bars typically have 0 radius. Could be dynamic for the top piece, but Recharts handles it decently.
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
