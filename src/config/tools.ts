
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
    X,
    Type,
    ImagePlus,
    EyeOff,
    Hash,
    Maximize,
    PenTool,
    Minimize2,
    Unlock,
    Shield,
    Wrench,
    Archive,
    Camera,
    FileType2,
    Table,
    Presentation,
    FileInput,
    ScanText,
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
        title: 'Organize PDF',
        description: 'Sort, rotate, and delete pages visually.',
        href: '/pdf/organize',
        icon: Layers,
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
    {
        title: 'Add Text',
        description: 'Place text anywhere on your PDF pages.',
        href: '/pdf/add-text',
        icon: Type,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Add Image',
        description: 'Overlay logos, stamps, or signatures.',
        href: '/pdf/add-image',
        icon: ImagePlus,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Redact PDF',
        description: 'Black out sensitive content permanently.',
        href: '/pdf/redact',
        icon: EyeOff,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Page Numbers',
        description: 'Add automatic page numbering.',
        href: '/pdf/page-numbers',
        icon: Hash,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Resize Pages',
        description: 'Change page dimensions — A4, Letter, custom.',
        href: '/pdf/resize-pages',
        icon: Maximize,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'PDF Editor',
        description: 'All-in-one visual PDF editor.',
        href: '/pdf/editor',
        icon: PenTool,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },

    {
        title: 'Compress PDF',
        description: 'Reduce file size while maintaining quality.',
        href: '/pdf/compress',
        icon: Minimize2,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Unlock PDF',
        description: 'Remove passwords and encryption.',
        href: '/pdf/unlock',
        icon: Unlock,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Protect PDF',
        description: 'Encrypt your PDF with a password.',
        href: '/pdf/protect',
        icon: Shield,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Repair PDF',
        description: 'Fix corrupt or damaged PDF files.',
        href: '/pdf/repair',
        icon: Wrench,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'PDF/A',
        description: 'Convert to ISO-standard PDF/A format.',
        href: '/pdf/pdfa',
        icon: Archive,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Scan to PDF',
        description: 'Capture images and create a PDF.',
        href: '/pdf/scan',
        icon: Camera,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'PDF to Word',
        description: 'Convert PDF to editable Word doc.',
        href: '/pdf/pdf-to-word',
        icon: FileType2,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'PDF to Excel',
        description: 'Extract tables to Excel spreadsheets.',
        href: '/pdf/pdf-to-excel',
        icon: Table,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'PDF to PowerPoint',
        description: 'Convert PDF slides to PowerPoint.',
        href: '/pdf/pdf-to-ppt',
        icon: Presentation,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'Office to PDF',
        description: 'Convert Word, Excel, PPT to PDF.',
        href: '/pdf/office-to-pdf',
        icon: FileInput,
        iconColor: '#ef4444',
        category: 'PDF',
        gradient: 'from-red-500/10 to-transparent'
    },
    {
        title: 'OCR PDF',
        description: 'Make scanned PDFs searchable.',
        href: '/pdf/ocr',
        icon: ScanText,
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

    // OCR Tools
    {
        title: 'Image to Text',
        description: 'Extract text from images.',
        href: '/ocr',
        icon: ScanText,
        iconColor: '#a855f7',
        category: 'OCR',
        gradient: 'from-purple-500/10 to-transparent'
    },
    {
        title: 'PDF OCR',
        description: 'Make scanned PDFs searchable.',
        href: '/pdf/ocr',
        icon: FileText,
        iconColor: '#a855f7',
        category: 'OCR',
        gradient: 'from-purple-500/10 to-transparent'
    },
];

