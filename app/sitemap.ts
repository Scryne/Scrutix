import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { APP_URL } from '@/constants/app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = APP_URL;

    // Add static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/elections`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/map`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/polls`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/accuracy`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/legal/methodology`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/legal/disclaimer`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/legal/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    try {
        // Add dynamic election pages
        const elections = await prisma.election.findMany({
            where: { isDeleted: false, status: 'COMPLETED' },
            select: { slug: true, updatedAt: true },
        });

        const dynamicPages: MetadataRoute.Sitemap = elections.map((election) => ({
            url: `${baseUrl}/elections/${election.slug}`,
            lastModified: election.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        return [...staticPages, ...dynamicPages];
    } catch (error) {
        console.error('[SITEMAP_ERROR]', error);
        // Return static minimally if dynamic fails
        return staticPages;
    }
}
