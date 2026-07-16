import { MetadataRoute } from 'next';
import { TOOLS } from '@/config/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://modufile.com';

    const hubs = ['/pdf', '/image', '/video'];
    const toolUrls = Array.from(new Set(TOOLS.map(t => t.href)));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        ...hubs.map((hub) => ({
            url: `${baseUrl}${hub}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
        ...toolUrls.map((href) => ({
            url: `${baseUrl}${href}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/thanks`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];
}
