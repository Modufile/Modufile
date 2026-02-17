export interface FAQ {
    question: string;
    answer: string;
}

export const toolFaqs: Record<string, FAQ[]> = {
    /* ------------------------------------------------------------------ */
    /*  PDF TOOLS                                                          */
    /* ------------------------------------------------------------------ */

    'pdf-merge': [
        {
            question: 'Is it safe to merge PDFs online?',
            answer: 'Yes. Modufile processes everything locally in your browser using WebAssembly. Your files are never uploaded to any server, so your data stays completely private.',
        },
        {
            question: 'Is there a file size limit?',
            answer: 'There is no hard server limit since processing happens on your device. Very large files (100 MB+) depend on your device\'s available memory.',
        },
        {
            question: 'Can I reorder the PDFs before merging?',
            answer: 'Yes. Simply drag and drop the files in the list to change the order before merging.',
        },
        {
            question: 'Will merging affect the quality of my PDFs?',
            answer: 'No. Modufile copies pages directly at the PDF structure level using pdf-lib. No re-encoding or rasterization occurs, so quality is perfectly preserved.',
        },
        {
            question: 'Can I merge password-protected PDFs?',
            answer: 'Currently, password-protected PDFs are not supported. You\'ll need to remove the password first using another tool before merging.',
        },
    ],

    'pdf-split': [
        {
            question: 'What are the different split modes?',
            answer: 'Modufile offers three modes: "Merge Selected" combines chosen pages into one file, "Separate Clusters" splits consecutive page ranges into individual files, and "Burst" creates one PDF per selected page.',
        },
        {
            question: 'Can I select specific pages to extract?',
            answer: 'Yes. Click individual page thumbnails to select them. Hold Shift and click to select a range of pages at once.',
        },
        {
            question: 'How are the output files downloaded?',
            answer: 'If only one file is produced, it downloads directly. If multiple files are created (Burst or Separate Clusters), they are packaged into a single ZIP file for convenience.',
        },
        {
            question: 'Does splitting reduce PDF quality?',
            answer: 'No. Pages are copied at the PDF object level, preserving all fonts, images, and vector graphics at full quality.',
        },
    ],

    'pdf-rotate': [
        {
            question: 'Does rotating change the content of my PDF?',
            answer: 'No. Rotation only changes the page orientation metadata. All text, images, and vectors remain intact and lossless.',
        },
        {
            question: 'Can I rotate individual pages?',
            answer: 'Currently, the rotation applies to all pages in the document. For per-page rotation, use the PDF Organize tool.',
        },
        {
            question: 'What rotation angles are supported?',
            answer: 'You can rotate in 90° increments: 90° (clockwise), 180° (upside down), and 270° (counter-clockwise).',
        },
    ],

    'pdf-redact': [
        {
            question: 'Is this true redaction or just a visual overlay?',
            answer: 'This is true, permanent redaction. Modufile uses MuPDF\'s WASM engine to physically remove the underlying text and image data from the PDF content stream. The redacted content cannot be recovered by any tool.',
        },
        {
            question: 'Can I search for text to redact?',
            answer: 'Yes. Use the "Find & Redact" feature in the sidebar. Enter a search term, and Modufile will highlight all occurrences. You can then redact all of them with a single click.',
        },
        {
            question: 'What happens to metadata during redaction?',
            answer: 'The current redaction focuses on page content. Metadata fields (title, author, etc.) are preserved. Use the Metadata tool separately if you need to clear those.',
        },
        {
            question: 'Can I undo a redaction after saving?',
            answer: 'No. Once you save, the redaction is permanent and irreversible — that\'s the point of true redaction. Always keep a backup of your original file.',
        },
        {
            question: 'Is my data safe during redaction?',
            answer: 'Absolutely. The entire process runs in your browser via WebAssembly. Your PDF is never sent to any server. Even the MuPDF engine runs locally.',
        },
    ],

    'pdf-watermark': [
        {
            question: 'What types of watermarks can I add?',
            answer: 'You can add text watermarks with customizable content, font size, color, opacity, and rotation angle.',
        },
        {
            question: 'Can I control the position and opacity?',
            answer: 'Yes. You can adjust the opacity so the watermark is subtle, and the rotation angle to place it diagonally or at any angle you prefer.',
        },
        {
            question: 'Does watermarking rasterize the PDF?',
            answer: 'No. The watermark is added as a vector text overlay using pdf-lib, preserving the original PDF quality and keeping the file searchable.',
        },
    ],

    'pdf-flatten': [
        {
            question: 'What does "flattening" a PDF mean?',
            answer: 'Flattening merges interactive form fields (text boxes, checkboxes, dropdowns) into the static page content. The filled-in values become permanent text, and the fields can no longer be edited.',
        },
        {
            question: 'When should I flatten a PDF?',
            answer: 'Flatten when you need to share a completed form and prevent further edits, or when a form isn\'t displaying correctly in some viewers.',
        },
        {
            question: 'Can I un-flatten a PDF?',
            answer: 'No. Flattening is a one-way operation. The form fields become part of the page content and cannot be separated again. Always keep a backup.',
        },
    ],

    'pdf-metadata': [
        {
            question: 'What metadata fields can I edit?',
            answer: 'You can edit the Title, Author, Subject, Keywords, Creator, and Producer fields stored in the PDF\'s Info dictionary.',
        },
        {
            question: 'Does editing metadata change the PDF content?',
            answer: 'No. Metadata is stored separately from page content. Editing it has zero effect on the visual appearance or structure of your document.',
        },
        {
            question: 'Why would I want to edit PDF metadata?',
            answer: 'Common reasons include: removing personal information before sharing, setting a proper title for accessibility, or adding keywords for document management systems.',
        },
    ],

    'pdf-extract': [
        {
            question: 'What is the difference between Extract and Split?',
            answer: 'Extract always outputs selected pages as a single merged PDF. Split offers additional modes like Burst (one PDF per page) and Separate Clusters (one PDF per consecutive group).',
        },
        {
            question: 'Can I extract non-consecutive pages?',
            answer: 'Yes. Click on individual page thumbnails to select any combination of pages, even non-consecutive ones. They will be merged into a single output file in the order they appear.',
        },
    ],

    'pdf-remove-pages': [
        {
            question: 'Can I undo after removing pages?',
            answer: 'The tool creates a new file — your original PDF is never modified. If you need the removed pages back, simply use your original file.',
        },
        {
            question: 'Does removing pages affect the remaining pages?',
            answer: 'No. Remaining pages are copied at the structure level and are completely unaffected in quality, layout, or content.',
        },
    ],

    'pdf-organize': [
        {
            question: 'What can I do in the organizer?',
            answer: 'You can visually reorder pages by dragging thumbnails, delete unwanted pages, and then save the reorganized document.',
        },
        {
            question: 'Can I add pages from another PDF?',
            answer: 'Not directly in the organizer. Use the Merge tool to combine multiple PDFs first, then use the Organizer to arrange the combined pages.',
        },
    ],

    'pdf-page-numbers': [
        {
            question: 'Where are the page numbers placed?',
            answer: 'Page numbers are added to the bottom center of each page. The position, font size, and starting number can be customized.',
        },
        {
            question: 'Can I skip numbering on certain pages?',
            answer: 'Currently, page numbers are applied to all pages uniformly. For selective numbering, use the PDF Editor.',
        },
    ],

    'pdf-resize-pages': [
        {
            question: 'What page sizes are supported?',
            answer: 'Common sizes like A4, Letter, Legal, A3, and custom dimensions. Content is scaled proportionally to fit the new size.',
        },
        {
            question: 'Does resizing affect text quality?',
            answer: 'No. Since PDF text and vectors are resolution-independent, resizing preserves full quality. Only embedded raster images may appear slightly different at very different scales.',
        },
    ],

    'pdf-add-text': [
        {
            question: 'Can I choose the font for the added text?',
            answer: 'Yes. You can select from standard PDF fonts including Helvetica, Times Roman, and Courier in regular and bold variants.',
        },
        {
            question: 'Is the text searchable after adding?',
            answer: 'Yes. Text is added as native PDF text objects, making it fully searchable and selectable in any PDF viewer.',
        },
    ],

    'pdf-add-image': [
        {
            question: 'What image formats are supported?',
            answer: 'PNG and JPEG images are supported for embedding into the PDF.',
        },
        {
            question: 'Can I control the position and size?',
            answer: 'Yes. You can set the X/Y coordinates and dimensions. The image is embedded with full quality into the PDF.',
        },
    ],

    /* ------------------------------------------------------------------ */
    /*  IMAGE TOOLS                                                        */
    /* ------------------------------------------------------------------ */

    'image-convert': [
        {
            question: 'What formats can I convert between?',
            answer: 'You can convert between JPG, PNG, WebP, and AVIF. Input formats also include HEIC, TIFF, BMP, and more via the ImageMagick WASM engine.',
        },
        {
            question: 'Is there a quality loss during conversion?',
            answer: 'Lossy formats (JPG, WebP, AVIF) involve some compression, but the quality is typically excellent at default settings. Converting to PNG is always lossless.',
        },
        {
            question: 'Can I batch convert multiple images?',
            answer: 'Yes. Drop as many images as you need and they will all be converted to the selected target format.',
        },
        {
            question: 'Are my images uploaded to a server?',
            answer: 'No. All conversion happens locally in your browser using ImageMagick compiled to WebAssembly. Your images never leave your device.',
        },
    ],

    'image-compress': [
        {
            question: 'How much can file sizes be reduced?',
            answer: 'Typical reductions are 40–80% depending on the original image and quality setting. The preview lets you compare before and after.',
        },
        {
            question: 'Does compression affect image quality?',
            answer: 'Some quality reduction occurs with lossy compression, but at recommended settings the difference is virtually imperceptible to the human eye.',
        },
        {
            question: 'What compression algorithms are used?',
            answer: 'Modufile uses ImageMagick\'s optimized encoders running as WebAssembly, supporting quality control and metadata stripping for maximum size reduction.',
        },
    ],

    'image-resize': [
        {
            question: 'Can I resize while maintaining the aspect ratio?',
            answer: 'Yes. By default, aspect ratio is preserved. You can also choose to resize to exact dimensions if needed.',
        },
        {
            question: 'What interpolation method is used?',
            answer: 'ImageMagick uses high-quality Lanczos resampling by default, which produces sharp results even when upscaling.',
        },
    ],

    'image-batch': [
        {
            question: 'What operations can I chain?',
            answer: 'You can chain resize, filter, and convert operations. Each operation is applied sequentially to all images in the batch.',
        },
        {
            question: 'Is there a limit on how many images I can process?',
            answer: 'There\'s no artificial limit. Performance depends on your device\'s RAM and processing power since everything runs locally.',
        },
    ],

    /* ------------------------------------------------------------------ */
    /*  OCR                                                                */
    /* ------------------------------------------------------------------ */

    'ocr': [
        {
            question: 'What languages are supported?',
            answer: 'Tesseract.js supports over 100 languages. The most common (English, Spanish, French, German, Chinese, Japanese, etc.) are available by default.',
        },
        {
            question: 'How accurate is the OCR?',
            answer: 'Accuracy depends on image quality. Clear, high-resolution scans typically achieve 95%+ accuracy. Noisy or low-resolution images will have lower accuracy.',
        },
        {
            question: 'Can I OCR a multi-page PDF?',
            answer: 'Currently, OCR works on single images. For multi-page PDFs, extract each page as an image first, then OCR each one.',
        },
        {
            question: 'Does OCR run locally?',
            answer: 'Yes. Tesseract.js runs entirely in your browser via a Web Worker. No data is sent to any server.',
        },
    ],
};
