/**
 * seo.ts — Central SEO definitions for every tool page.
 *
 * Single source of truth for long-tail titles, meta descriptions, keywords,
 * canonical URLs, and JSON-LD structured data. Each tool route has a thin
 * layout.tsx that calls toolMetadata()/toolJsonLd() with its key.
 *
 * Title rule: ≤60 chars before the " | Modufile" template suffix, leading
 * with the highest-volume long-tail phrase for that tool.
 */

import type { Metadata } from 'next';
import { toolContent } from '@/data/tool-faqs';

export const SITE_URL = 'https://modufile.com';

export interface ToolSeo {
    /** Route path with trailing slash to match static export URLs. */
    path: string;
    /** Hub for breadcrumbs, e.g. ['PDF Tools', '/pdf']. Omit for top-level tools. */
    hub?: [string, string];
    title: string;
    description: string;
    keywords: string[];
    /** toolContent key for FAQPage schema. Omit if the tool has no FAQ content. */
    faqKey?: string;
}

export const TOOL_SEO: Record<string, ToolSeo> = {
    /* ── PDF ─────────────────────────────────────────────────────────── */
    'pdf-merge': {
        path: '/pdf/merge/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-merge',
        title: 'Merge PDF Files Online Free — No Upload, No Watermark',
        description: 'Combine PDF files into one document for free. Merging runs 100% in your browser — files never touch a server. No watermark, no sign-up, no size limits.',
        keywords: ['merge pdf', 'combine pdf files', 'merge pdf online free', 'join pdf files', 'pdf combiner', 'merge pdf without watermark', 'combine pdf files into one', 'merge pdf offline'],
    },
    'pdf-split': {
        path: '/pdf/split/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-split',
        title: 'Split PDF Online Free — Extract Pages from PDF',
        description: 'Split a PDF into separate files or extract specific pages for free. Everything runs in your browser — private, instant, no upload, no watermark.',
        keywords: ['split pdf', 'extract pages from pdf', 'split pdf online free', 'separate pdf pages', 'pdf splitter', 'extract pdf pages online', 'split pdf into multiple files'],
    },
    'pdf-compress': {
        path: '/pdf/compress/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-compress',
        title: 'Compress PDF Online Free — Reduce PDF File Size',
        description: 'Shrink PDF file size for free without uploading. Compression runs locally in your browser via WebAssembly — private, fast, and watermark-free.',
        keywords: ['compress pdf', 'reduce pdf size', 'compress pdf online free', 'shrink pdf', 'pdf compressor', 'make pdf smaller', 'compress pdf without losing quality', 'reduce pdf file size to 100kb'],
    },
    'pdf-to-word': {
        path: '/pdf/pdf-to-word/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-to-word',
        title: 'PDF to Word Converter Free — No Upload, No Email',
        description: 'Convert PDF to an editable Word document for free, entirely in your browser. No upload, no email required, no page limits.',
        keywords: ['pdf to word', 'convert pdf to word', 'pdf to word converter free', 'pdf to docx', 'pdf to word without email', 'convert pdf to editable word', 'pdf to word offline'],
    },
    'pdf-to-excel': {
        path: '/pdf/pdf-to-excel/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-to-excel',
        title: 'PDF to Excel Converter Free — Extract Tables Online',
        description: 'Convert PDF to Excel (XLSX) for free in your browser. Extract table data without uploading your files anywhere — private and instant.',
        keywords: ['pdf to excel', 'convert pdf to excel', 'pdf to xlsx', 'extract table from pdf', 'pdf to excel converter free', 'pdf to spreadsheet'],
    },
    'office-to-pdf': {
        path: '/pdf/office-to-pdf/', hub: ['PDF Tools', '/pdf'], faqKey: 'office-to-pdf',
        title: 'Word to PDF Converter — DOCX, Excel, PPT to PDF Free',
        description: 'Convert Word, Excel, and PowerPoint documents to PDF for free in your browser. Private conversion — your documents are never uploaded.',
        keywords: ['word to pdf', 'docx to pdf', 'excel to pdf', 'ppt to pdf', 'convert word to pdf free', 'office to pdf converter', 'doc to pdf online'],
    },
    'pdf-editor': {
        path: '/pdf/editor/', hub: ['PDF Tools', '/pdf'],
        title: 'Free PDF Editor Online — Annotate, Sign & Fill PDFs',
        description: 'Edit PDFs free in your browser: add text, highlights, shapes, stamps, signatures, and redactions. No upload, no watermark, no account.',
        keywords: ['pdf editor', 'edit pdf online free', 'annotate pdf', 'sign pdf online', 'add text to pdf', 'draw on pdf', 'fill pdf form online', 'pdf markup tool'],
    },
    'pdf-rotate': {
        path: '/pdf/rotate/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-rotate',
        title: 'Rotate PDF Online Free — Rotate Pages & Save',
        description: 'Rotate PDF pages 90, 180, or 270 degrees and save permanently — free and private, right in your browser with no upload.',
        keywords: ['rotate pdf', 'rotate pdf online', 'rotate pdf pages and save', 'rotate pdf 90 degrees', 'fix upside down pdf', 'rotate single page in pdf'],
    },
    'pdf-remove-pages': {
        path: '/pdf/remove-pages/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-remove-pages',
        title: 'Delete Pages from PDF Online Free',
        description: 'Remove pages from a PDF for free in your browser. Select the pages to delete visually and download the cleaned file — no upload needed.',
        keywords: ['delete pages from pdf', 'remove pages from pdf', 'pdf page remover', 'delete pdf pages online free', 'remove blank pages from pdf'],
    },
    'pdf-organize': {
        path: '/pdf/organize/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-organize',
        title: 'Organize & Reorder PDF Pages Online Free',
        description: 'Reorder, rotate, and delete PDF pages with drag and drop — free, in your browser, with live page thumbnails and no upload.',
        keywords: ['reorder pdf pages', 'rearrange pdf pages', 'organize pdf', 'move pages in pdf', 'change pdf page order online free', 'sort pdf pages'],
    },
    'pdf-watermark': {
        path: '/pdf/watermark/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-watermark',
        title: 'Add Watermark to PDF Online Free — Text & Image',
        description: 'Stamp a text or image watermark across PDF pages for free. Position, rotate, and style it with a live preview — all in your browser.',
        keywords: ['add watermark to pdf', 'pdf watermark online free', 'watermark pdf', 'add text to every pdf page', 'confidential stamp pdf', 'image watermark pdf'],
    },
    'pdf-metadata': {
        path: '/pdf/metadata/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-metadata',
        title: 'Edit PDF Metadata Online — Title, Author, Keywords',
        description: 'View and edit PDF metadata — title, author, subject, keywords, dates — for free in your browser. Nothing is uploaded.',
        keywords: ['edit pdf metadata', 'change pdf title', 'pdf metadata editor', 'change pdf author', 'remove pdf metadata', 'pdf properties editor'],
    },
    'pdf-page-numbers': {
        path: '/pdf/page-numbers/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-page-numbers',
        title: 'Add Page Numbers to PDF Online Free',
        description: 'Insert automatic page numbers into a PDF for free — choose position, format, and starting number, with everything processed in your browser.',
        keywords: ['add page numbers to pdf', 'pdf page numbers online free', 'number pdf pages', 'insert page numbers pdf', 'bates numbering pdf'],
    },
    'pdf-flatten': {
        path: '/pdf/flatten/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-flatten',
        title: 'Flatten PDF Online Free — Make Form Fields Uneditable',
        description: 'Flatten PDF form fields so they can no longer be edited — free, private, and instant in your browser.',
        keywords: ['flatten pdf', 'flatten pdf form', 'make pdf uneditable', 'flatten fillable pdf', 'lock pdf form fields'],
    },
    'pdf-protect': {
        path: '/pdf/protect/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-protect',
        title: 'Password Protect PDF Online Free — Encrypt PDF',
        description: 'Add a password to a PDF for free. Encryption happens in your browser, so neither the file nor the password ever leaves your device.',
        keywords: ['password protect pdf', 'encrypt pdf', 'add password to pdf free', 'lock pdf', 'secure pdf with password', 'protect pdf online'],
    },
    'pdf-unlock': {
        path: '/pdf/unlock/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-unlock',
        title: 'Unlock PDF Online Free — Remove PDF Password',
        description: 'Remove a password from a PDF you own — free and private. Decryption runs in your browser, so your file and password are never sent anywhere.',
        keywords: ['unlock pdf', 'remove pdf password', 'pdf password remover', 'decrypt pdf', 'unlock pdf online free', 'remove security from pdf'],
    },
    'pdf-repair': {
        path: '/pdf/repair/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-repair',
        title: 'Repair Corrupt PDF Online Free — Fix Damaged PDFs',
        description: 'Fix corrupt or damaged PDF files that will not open — free, in your browser, powered by the MuPDF engine. No upload required.',
        keywords: ['repair pdf', 'fix corrupt pdf', 'pdf repair tool online free', 'recover damaged pdf', 'pdf won\'t open fix'],
    },
    'pdf-pdfa': {
        path: '/pdf/pdfa/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-pdfa',
        title: 'Convert PDF to PDF/A Online Free — ISO Archival Format',
        description: 'Convert PDFs to the ISO-standard PDF/A archival format for free in your browser — required for legal filings and long-term archiving.',
        keywords: ['pdf to pdf/a', 'convert pdf to pdfa', 'pdf/a converter online free', 'archival pdf format', 'pdf/a for court filing'],
    },
    'pdf-redact': {
        path: '/pdf/redact/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-redact',
        title: 'Redact PDF Online Free — Permanently Black Out Text',
        description: 'Permanently remove sensitive content from PDFs — true redaction that deletes the underlying text, not just a black box. Runs privately in your browser.',
        keywords: ['redact pdf', 'black out text in pdf', 'redact pdf online free', 'permanently remove text from pdf', 'pdf redaction tool', 'censor pdf'],
    },
    'pdf-ocr': {
        path: '/pdf/ocr/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-ocr',
        title: 'OCR PDF Online Free — Make Scanned PDFs Searchable',
        description: 'Add a searchable text layer to scanned PDFs for free. OCR in 100+ languages runs entirely in your browser — documents never leave your device.',
        keywords: ['ocr pdf', 'make scanned pdf searchable', 'pdf ocr online free', 'searchable pdf converter', 'ocr scanned document', 'extract text from scanned pdf'],
    },
    'pdf-resize-pages': {
        path: '/pdf/resize-pages/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-resize-pages',
        title: 'Resize PDF Pages Online — A4, Letter, Custom Sizes',
        description: 'Change PDF page dimensions to A4, Letter, Legal, or custom sizes for free — processed locally in your browser with no upload.',
        keywords: ['resize pdf pages', 'change pdf page size', 'convert pdf to a4', 'pdf page size converter', 'scale pdf pages'],
    },
    'pdf-scan': {
        path: '/pdf/scan/', hub: ['PDF Tools', '/pdf'], faqKey: 'pdf-scan',
        title: 'Scan to PDF Online Free — Camera Document Scanner',
        description: 'Turn your device camera into a document scanner and save captures as a PDF — free and private, with photos processed only on your device.',
        keywords: ['scan to pdf', 'camera document scanner online', 'photo to pdf', 'scan documents with phone', 'mobile scanner to pdf free'],
    },

    /* ── Image ───────────────────────────────────────────────────────── */
    'image-compress': {
        path: '/image/compress/', hub: ['Image Tools', '/image'], faqKey: 'image-compress',
        title: 'Compress Images Online Free — JPG, PNG, WebP, AVIF',
        description: 'Reduce image file size for free without visible quality loss. Compression runs in your browser — photos are never uploaded. Batch supported.',
        keywords: ['compress image', 'image compressor online free', 'reduce image size', 'compress jpg', 'compress png', 'compress image to 100kb', 'shrink photo size', 'compress image without losing quality'],
    },
    'image-convert': {
        path: '/image/convert/', hub: ['Image Tools', '/image'], faqKey: 'image-convert',
        title: 'Image Converter Free — HEIC to JPG, WebP, AVIF, PNG',
        description: 'Convert images between HEIC, JPG, PNG, WebP, AVIF, and TIFF for free — instantly in your browser with zero uploads.',
        keywords: ['heic to jpg', 'image converter online free', 'webp to jpg', 'webp to png', 'avif to jpg', 'convert heic to jpeg', 'tiff to jpg', 'png to webp'],
    },
    'image-resize': {
        path: '/image/resize/', hub: ['Image Tools', '/image'], faqKey: 'image-resize',
        title: 'Resize Images Online Free — Change Dimensions & Crop',
        description: 'Resize images to exact pixel dimensions or aspect ratios for free — private, in-browser processing with no upload and no watermark.',
        keywords: ['resize image', 'image resizer online free', 'resize photo', 'change image dimensions', 'resize image to 2x2', 'resize image for instagram', 'crop image online'],
    },
    'image-batch': {
        path: '/image/batch/', hub: ['Image Tools', '/image'], faqKey: 'image-batch',
        title: 'Batch Image Editor Online — Resize & Convert Many Images',
        description: 'Process many images at once: chain resize, filter, and format conversion steps in one pipeline — free and fully in-browser.',
        keywords: ['batch image resize', 'bulk image converter', 'batch photo editor online', 'resize multiple images at once', 'bulk compress images'],
    },
    'image-exif': {
        path: '/image/exif/', hub: ['Image Tools', '/image'], faqKey: 'image-exif',
        title: 'Remove EXIF Data Online Free — GPS Metadata Remover',
        description: 'See what hidden metadata your photos carry — GPS location, camera, timestamps — and strip it losslessly. Nothing is uploaded, unlike other EXIF removers.',
        keywords: ['remove exif data', 'exif remover online', 'remove gps from photo', 'view exif data', 'photo metadata remover', 'strip image metadata', 'exif viewer online free'],
    },

    /* ── Video ───────────────────────────────────────────────────────── */
    'video-convert': {
        path: '/video/convert/', hub: ['Video Tools', '/video'], faqKey: 'video-convert',
        title: 'Video Converter Online Free — MOV to MP4, MP4 to WebM',
        description: 'Convert videos between MP4 and WebM free in your browser — hardware-accelerated, no upload, no file size limit, no watermark.',
        keywords: ['video converter online free', 'mov to mp4', 'mp4 to webm', 'webm to mp4', 'mkv to mp4', 'convert video without uploading', 'video converter no watermark'],
    },
    'video-trim': {
        path: '/video/trim/', hub: ['Video Tools', '/video'], faqKey: 'video-trim',
        title: 'Trim Video Online Free — Cut Video Without Watermark',
        description: 'Cut a clip from any video by start and end time — free, lossless, and instant in your browser. No upload, no watermark, no quality loss.',
        keywords: ['trim video online free', 'cut video online', 'video trimmer no watermark', 'crop video length', 'cut mp4 online', 'trim video without losing quality'],
    },
    'video-extract-audio': {
        path: '/video/extract-audio/', hub: ['Video Tools', '/video'], faqKey: 'video-extract-audio',
        title: 'Video to MP3 Converter Free — Extract Audio from Video',
        description: 'Extract the audio track from any video as MP3, M4A, or WAV — free and private, converted entirely on your device.',
        keywords: ['video to mp3', 'extract audio from video', 'mp4 to mp3 converter free', 'video to audio converter', 'get audio from video online', 'mp4 to wav'],
    },

    /* ── Other tools ─────────────────────────────────────────────────── */
    'ocr': {
        path: '/ocr/', faqKey: 'ocr',
        title: 'Image to Text Converter Free — OCR Online, No Upload',
        description: 'Extract text from images and photos for free with OCR in 100+ languages. Recognition runs in your browser — images are never uploaded.',
        keywords: ['image to text', 'ocr online free', 'extract text from image', 'photo to text converter', 'jpg to text', 'screenshot to text', 'picture to text'],
    },
    'zip-create': {
        path: '/zip/', faqKey: 'zip-create',
        title: 'Create ZIP File Online Free — Compress Files to ZIP',
        description: 'Bundle files into a ZIP archive for free, right in your browser. Files are compressed locally and never uploaded — safe for private documents.',
        keywords: ['create zip file online', 'make zip file free', 'compress files to zip', 'zip files online without software', 'online zip creator'],
    },
    'zip-extract': {
        path: '/unzip/', faqKey: 'zip-extract',
        title: 'Unzip Files Online Free — Open & Extract ZIP Archives',
        description: 'Open a ZIP archive and download its files — free, in your browser, with nothing uploaded. Safe for archives with sensitive documents.',
        keywords: ['unzip files online', 'open zip file online free', 'extract zip online', 'zip extractor no software', 'view zip contents online'],
    },
    'qr-generator': {
        path: '/qr/', faqKey: 'qr-generator',
        title: 'QR Code Generator Free — PNG & SVG, No Sign-Up',
        description: 'Create QR codes for links, Wi-Fi, and text — free, instant, and private. Generated in your browser (never logged), downloadable as PNG or SVG.',
        keywords: ['qr code generator free', 'create qr code', 'qr code for wifi', 'qr code generator no sign up', 'svg qr code', 'qr code maker online', 'custom color qr code'],
    },
    'mermaid-to-flowchart': {
        path: '/mermaid-to-flowchart/', faqKey: 'mermaid-to-flowchart',
        title: 'Mermaid Flowchart Editor — Visual Diagram Builder Online',
        description: 'Build flowcharts visually with live two-way Mermaid code sync. Export SVG, PNG, or PDF — free, private, and fully in your browser.',
        keywords: ['mermaid editor', 'mermaid flowchart', 'mermaid live editor alternative', 'flowchart maker online free', 'mermaid diagram to image', 'visual mermaid builder'],
    },

    /* ── Hubs ────────────────────────────────────────────────────────── */
    'hub-pdf': {
        path: '/pdf/',
        title: 'Free PDF Tools Online — Private, No Upload Required',
        description: 'Every PDF tool you need — merge, split, compress, edit, convert, OCR, redact — free and processed entirely in your browser. Your files never leave your device.',
        keywords: ['pdf tools online free', 'pdf editor no upload', 'ilovepdf alternative', 'smallpdf alternative', 'private pdf tools', 'offline pdf tools'],
    },
    'hub-image': {
        path: '/image/',
        title: 'Free Image Tools Online — Convert, Compress, Resize',
        description: 'Convert, compress, resize, and clean metadata from images — free tools that run entirely in your browser with zero uploads.',
        keywords: ['image tools online free', 'photo tools no upload', 'private image converter', 'image editor online free'],
    },
    'hub-video': {
        path: '/video/',
        title: 'Free Video Tools Online — Convert, Trim, Extract Audio',
        description: 'Convert, trim, and extract audio from videos — hardware-accelerated tools that run in your browser. No uploads, no watermarks, no limits.',
        keywords: ['video tools online free', 'video editor no upload', 'video converter no watermark', 'private video tools'],
    },
};

/** Builds the Next.js Metadata object for a tool page. */
export function toolMetadata(key: string): Metadata {
    const seo = TOOL_SEO[key];
    if (!seo) throw new Error(`Unknown SEO key: ${key}`);
    const url = `${SITE_URL}${seo.path}`;
    return {
        // Hub layouts sit between the root layout and tool pages; a plain-string
        // title here would break the "%s | Modufile" template chain for children,
        // so hubs re-declare the template.
        title: key.startsWith('hub-')
            ? { default: seo.title, template: '%s | Modufile' }
            : seo.title,
        description: seo.description,
        keywords: seo.keywords,
        alternates: { canonical: url },
        openGraph: {
            type: 'website',
            url,
            title: `${seo.title} | Modufile`,
            description: seo.description,
            siteName: 'Modufile',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${seo.title} | Modufile`,
            description: seo.description,
        },
    };
}

/** Builds JSON-LD structured data: WebApplication + BreadcrumbList + FAQPage. */
export function toolJsonLd(key: string): object[] {
    const seo = TOOL_SEO[key];
    if (!seo) throw new Error(`Unknown SEO key: ${key}`);
    const url = `${SITE_URL}${seo.path}`;

    const blocks: object[] = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: `${seo.title} | Modufile`,
            url,
            description: seo.description,
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any (runs in the browser)',
            browserRequirements: 'Requires a modern browser with WebAssembly',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Modufile', item: SITE_URL },
                ...(seo.hub
                    ? [
                        { '@type': 'ListItem', position: 2, name: seo.hub[0], item: `${SITE_URL}${seo.hub[1]}` },
                        { '@type': 'ListItem', position: 3, name: seo.title, item: url },
                    ]
                    : [{ '@type': 'ListItem', position: 2, name: seo.title, item: url }]),
            ],
        },
    ];

    const faqs = seo.faqKey ? toolContent[seo.faqKey]?.faqs : undefined;
    if (faqs && faqs.length > 0) {
        blocks.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
        });
    }

    return blocks;
}
