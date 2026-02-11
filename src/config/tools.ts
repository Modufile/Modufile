
import {
    FileText,
    Scissors,
    ImageDown,
    Image,
    Film,
    Eye,
    Zap,
    Lock,
    ArrowRight,
    Github,
    Layers,
    RotateCw,
    FolderInput,
    Stamp,
    Tag,
    Scaling,
    RefreshCw,
    X
} from 'lucide-react';

export const TOOLS = [
    // PDF Tools
    {
        title: 'Merge PDF',
        description: 'Combine multiple docs into one file.',
        href: '/pdf/merge',
        icon: FileText,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Split PDF',
        description: 'Separate pages or burst entire document.',
        href: '/pdf/split',
        icon: Scissors,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Rotate PDF',
        description: 'Rotate pages 90, 180 or 270 degrees.',
        href: '/pdf/rotate',
        icon: RotateCw,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Remove Pages',
        description: 'Delete specific pages from your PDF.',
        href: '/pdf/remove-pages',
        icon: X,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Extract Pages',
        description: 'Create a new PDF from selected pages.',
        href: '/pdf/extract',
        icon: FolderInput,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Watermark',
        description: 'Add text overlay to your documents.',
        href: '/pdf/watermark',
        icon: Stamp,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Edit Metadata',
        description: 'Modify title, author, and keywords.',
        href: '/pdf/metadata',
        icon: Tag,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Flatten Forms',
        description: 'Make form fields uneditable.',
        href: '/pdf/flatten',
        icon: Layers,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },

    // Image Tools
    {
        title: 'Compress Image',
        description: 'Reduce file size efficiently.',
        href: '/image/compress',
        icon: ImageDown,
        iconColor: '#3b82f6',
        category: 'Image',
        gradient: 'from-blue-500/10 to-transparent'
    },
    {
        title: 'Convert Image',
        description: 'HEIC, WebP, PNG, JPG, AVIF.',
        href: '/image/convert',
        icon: Image,
        iconColor: '#3b82f6',
        category: 'Image',
        gradient: 'from-blue-500/10 to-transparent'
    },
    {
        title: 'Resize & Crop',
        description: 'Change dimensions or aspect ratio.',
        href: '/image/resize',
        icon: Scaling,
        iconColor: '#3b82f6',
        category: 'Image',
        gradient: 'from-blue-500/10 to-transparent'
    },
    {
        title: 'Batch Editor',
        description: 'Chain edits: Resize, crop, filter.',
        href: '/image/batch',
        icon: RefreshCw,
        iconColor: '#3b82f6',
        category: 'Image',
        gradient: 'from-blue-500/10 to-transparent'
    },

    // OCR
    {
        title: 'OCR',
        description: 'Extract text from scanned images.',
        href: '/ocr',
        icon: Eye,
        iconColor: '#a855f7',
        category: 'OCR',
        gradient: 'from-purple-500/10 to-transparent'
    },
];
