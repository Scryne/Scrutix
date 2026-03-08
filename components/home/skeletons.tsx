import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function UpcomingElectionsSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-4 gap-2 text-center">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="flex flex-col items-center">
                                    <Skeleton className="h-8 w-12 mb-1" />
                                    <Skeleton className="h-3 w-8" />
                                </div>
                            ))}
                        </div>
                        <Skeleton className="h-10 w-full mt-6" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function LatestPollsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="grid gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3 pb-4 last:pb-0 last:border-0 border-b">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div>
                                    <Skeleton className="h-4 w-24 mb-1" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <div className="flex gap-2">
                                <Skeleton className="h-2 flex-grow" />
                                <Skeleton className="h-2 w-1/4" />
                                <Skeleton className="h-2 w-1/6" />
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function FeaturedPredictionSkeleton() {
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex items-end gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-8 w-24 font-bold" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export function PlatformStatsSkeleton() {
    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                        <Skeleton className="h-8 w-8 rounded-full mb-2" />
                        <Skeleton className="h-8 w-16 font-bold" />
                        <Skeleton className="h-4 w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
