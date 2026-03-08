import type { MetadataRoute } from 'next';
import { APP_URL } from '@/constants/app';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = APP_URL;

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/admin/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
