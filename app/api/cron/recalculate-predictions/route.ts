import { NextResponse } from 'next/server';
import { runAllCalculationsJob, recalculateElectionPredictions } from '../../../../services/job.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 mins in Vercel maxDuration for PRO/Enterprise, standard is 10-60s for hobby/pro. Let's keep it max possible for Next.js

/**
 * GET Method
 * 1. Cron Job: Runs all active election recalculations (Vercel Cron).
 * 2. Manual Trigger: Can specify 'electionId' to recalculate only one election.
 */
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        // Check if triggered by Vercel Cron
        const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

        // Check if triggered manually via API key / Admin token
        const url = new URL(req.url);
        const apiKey = url.searchParams.get('apiKey');
        const isManual = apiKey && apiKey === process.env.ADMIN_API_KEY;

        // Determine trigger source
        let triggerSource: 'cron' | 'manual' | 'webhook' = 'webhook';
        if (isCron) triggerSource = 'cron';
        else if (isManual) triggerSource = 'manual';

        // Auth guard (Cron or Manual)
        if (!isCron && !isManual && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
        }

        // Seçim ID'si verilmiş mi kontrol et (Tek seçim için)
        const electionId = url.searchParams.get('electionId');

        if (electionId) {
            const result = await recalculateElectionPredictions(electionId, triggerSource);
            if (!result.success) {
                return NextResponse.json(result, { status: 400 });
            }
            return NextResponse.json({ message: `Election ${electionId} recalculated successfully`, ...result });
        }

        // Tüm seçimler için (Gece Cron Job'ı)
        const jobLog = await runAllCalculationsJob(triggerSource);

        if (jobLog.status === "FAILED") {
            return NextResponse.json({ error: "Job Failed", log: jobLog }, { status: 500 });
        }

        return NextResponse.json({ message: "Background Job Completed Successfully", log: jobLog });

    } catch (error) {
        const errObj = error instanceof Error ? error : new Error(String(error));
        console.error(`[API/Cron] Fatal Error:`, errObj);
        return NextResponse.json({ error: "Internal Server Error", detail: errObj.message }, { status: 500 });
    }
}

/**
 * POST Method
 * Webhook triggered (e.g. When a new Poll is inserted to DB by another service)
 */
export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        // Simple verification (could be specific WEBHOOK_SECRET)
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
        }

        const body = await req.json();
        const electionId = body.electionId;

        if (!electionId) {
            return NextResponse.json({ error: 'electionId is required in request body' }, { status: 400 });
        }

        const result = await recalculateElectionPredictions(electionId, 'webhook');
        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json({ message: `Election ${electionId} recalculated via webhook event` });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
