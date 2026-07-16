import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    // Internal WASM playground — not a user-facing tool page
                    '/lab/',
                    // WASM engine assets (binaries, type defs, bundled READMEs)
                    '/wasm/',
                    // Large engine binaries at the site root
                    '/*.wasm$',
                    // Next.js RSC payload files (index.txt, __next.*.txt) —
                    // raw duplicates of page content that waste crawl budget
                    // and risk duplicate-content indexing. robots.txt itself
                    // is always fetched regardless of rules.
                    '/*.txt$',
                    // Next.js fallback route
                    '/_not-found/',
                ],
            },
        ],
        // Note: /_next/ (JS/CSS chunks) stays crawlable on purpose —
        // Google needs those resources to render pages for indexing.
        sitemap: 'https://modufile.com/sitemap.xml',
    };
}
