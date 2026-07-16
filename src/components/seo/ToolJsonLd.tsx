import { toolJsonLd } from '@/lib/seo';

/**
 * Server component that injects JSON-LD structured data
 * (WebApplication + BreadcrumbList + FAQPage) for a tool page.
 * Rendered from the route's layout.tsx.
 */
export function ToolJsonLd({ toolKey }: { toolKey: string }) {
    const blocks = toolJsonLd(toolKey);
    return (
        <>
            {blocks.map((block, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
                />
            ))}
        </>
    );
}
