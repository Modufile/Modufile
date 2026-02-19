export interface FAQ {
    question: string;
    answer: string;
}

export interface TechSetup {
    library: string;
    purpose: string;
}

export interface ToolContent {
    about: string;
    techSetup: TechSetup[];
    faqs: FAQ[];
}

export const toolContent: Record<string, ToolContent> = {
    /* ------------------------------------------------------------------ */
    /*  PDF TOOLS                                                          */
    /* ------------------------------------------------------------------ */

    'pdf-merge': {
        about: 'Modufile\'s Merge PDF tool lets you combine PDF files into a single document directly in your browser. It uses the pdf-lib library running entirely on the client side, so your files are never uploaded to any server. You can merge multiple PDFs, reorder them with drag and drop, and download the result instantly — with no file size limits, no account required, and no watermarks on the output. This makes it a privacy-first alternative to tools like iLovePDF or Smallpdf, which process files on their servers. Whether you need to combine contracts, join scanned pages, or merge PDF documents for a report, Modufile handles it without compromising quality or privacy.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Copies and combines pages from multiple PDF documents into a single output file' },
        ],
        faqs: [
            {
                question: 'Is it safe to merge PDFs online?',
                answer: 'Yes. Modufile processes everything locally in your browser using WebAssembly. Your files are never uploaded to any server, so your data stays completely private. This is a key difference from most online tools, which upload your PDFs to remote servers for processing.',
            },
            {
                question: 'Is there a file size limit for merging?',
                answer: 'There is no hard server limit since processing happens on your device. Very large files (100 MB+) depend on your device\'s available memory. Most users can comfortably merge PDF files well beyond what typical server-based tools allow.',
            },
            {
                question: 'Can I reorder the PDFs before merging?',
                answer: 'Yes. Simply drag and drop the files in the list to change the order before merging. This lets you combine PDFs into one document in exactly the sequence you need.',
            },
            {
                question: 'Will merging affect the quality of my PDFs?',
                answer: 'No. Modufile copies pages directly at the PDF structure level using pdf-lib. No re-encoding or rasterization occurs, so fonts, images, and vectors are perfectly preserved — the same as the original.',
            },
            {
                question: 'Can I merge password-protected PDFs?',
                answer: 'Currently, password-protected PDFs are not supported. You\'ll need to remove the password first using another tool before merging.',
            },
            {
                question: 'Can I combine PDFs into one file on mobile?',
                answer: 'Yes. Since Modufile runs in the browser, it works on any device — desktop, tablet, or phone. Open the tool in your mobile browser, add your files, and merge them directly.',
            },
            {
                question: 'How many PDFs can I combine at once?',
                answer: 'There is no artificial limit on the number of files. You can merge multiple PDFs into one document — the only constraint is your device\'s available memory.',
            },
            {
                question: 'Is the PDF merge tool free to use?',
                answer: 'Yes. Modufile\'s merge tool is completely free with no daily usage limits, no watermarks, and no registration required. Unlike some alternatives that restrict free users to a limited number of tasks per day, Modufile has no such restrictions.',
            },
            {
                question: 'Can I join PDF files and images (JPG, PNG) together?',
                answer: 'The merge tool is designed for combining PDF files. To include images, first convert them to PDF using the Image Convert tool, then merge them with your other PDF documents.',
            },
            {
                question: 'Does Modufile work offline?',
                answer: 'Once the page is loaded, processing is done entirely in your browser. However, an internet connection is needed to initially load the tool. All file handling is local — nothing is sent to a server.',
            },
        ],
    },

    'pdf-split': {
        about: 'Modufile\'s Split PDF tool lets you divide a PDF document into multiple files directly in your browser. It offers three split modes: Merge Selected (combine chosen pages into one file), Separate Clusters (split consecutive page ranges into individual files), and Burst (create one PDF per selected page). Everything runs locally with no file uploads, making it a secure alternative to server-based PDF splitters. Whether you need to extract specific pages, separate PDF pages into individual files, or split a PDF into multiple documents, the tool handles it while preserving full document quality.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Extracts and copies selected pages into new PDF documents' },
        ],
        faqs: [
            {
                question: 'What are the different split modes?',
                answer: 'Modufile offers three modes: "Merge Selected" combines chosen pages into one file, "Separate Clusters" splits consecutive page ranges into individual files, and "Burst" creates one PDF per selected page.',
            },
            {
                question: 'Can I select specific pages to extract?',
                answer: 'Yes. Click individual page thumbnails to select them. Hold Shift and click to select a range of pages at once. This makes it easy to split PDF pages or extract just the ones you need.',
            },
            {
                question: 'How are the output files downloaded?',
                answer: 'If only one file is produced, it downloads directly. If multiple files are created (Burst or Separate Clusters), they are packaged into a single ZIP file for convenience.',
            },
            {
                question: 'Does splitting reduce PDF quality?',
                answer: 'No. Pages are copied at the PDF object level, preserving all fonts, images, and vector graphics at full quality. No re-encoding or compression is applied.',
            },
            {
                question: 'Can I split a PDF into individual pages?',
                answer: 'Yes. Use the Burst mode to split a PDF into individual pages — each page becomes its own separate PDF file, downloaded together in a ZIP.',
            },
            {
                question: 'Is there a page limit for splitting?',
                answer: 'No. You can split PDFs of any length. Since all processing runs locally in your browser, there is no server-imposed page or file size limit.',
            },
            {
                question: 'Is the split tool free?',
                answer: 'Yes. Modufile\'s PDF splitter is completely free with no daily limits, no watermark, and no sign-up required.',
            },
            {
                question: 'Can I split a PDF online without uploading it?',
                answer: 'Yes. Modufile processes your file entirely in the browser. Your PDF is never sent to any server, making it safe to split PDF documents containing sensitive or confidential information.',
            },
            {
                question: 'Can I split and merge in one workflow?',
                answer: 'Not in a single step. Use the Split tool to divide your document, then use the Merge tool to combine the resulting files as needed. Both tools preserve full quality.',
            },
        ],
    },

    'pdf-rotate': {
        about: 'Modufile\'s Rotate PDF tool lets you change the orientation of pages in a PDF document directly in your browser. You can rotate all pages by 90\u00B0, 180\u00B0, or 270\u00B0 with a single click. The tool modifies only the page rotation metadata — no content is altered or re-rendered — so the operation is lossless and instant. It runs entirely client-side, which means your PDF is never uploaded to a server. This is ideal for fixing scanned documents that came in sideways, correcting page orientation before printing, or rotating a PDF from landscape to portrait.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Modifies page rotation metadata in the PDF document' },
        ],
        faqs: [
            {
                question: 'Does rotating change the content of my PDF?',
                answer: 'No. Rotation only changes the page orientation metadata. All text, images, and vectors remain intact and lossless.',
            },
            {
                question: 'Can I rotate individual pages?',
                answer: 'Currently, the rotation applies to all pages in the document. For per-page rotation, use the PDF Organize tool which lets you select and rotate specific pages.',
            },
            {
                question: 'What rotation angles are supported?',
                answer: 'You can rotate in 90\u00B0 increments: 90\u00B0 (clockwise), 180\u00B0 (upside down), and 270\u00B0 (counter-clockwise). This covers all common needs for fixing page orientation.',
            },
            {
                question: 'Can I rotate a PDF from landscape to portrait?',
                answer: 'Yes. If your PDF pages are in landscape orientation, rotating by 90\u00B0 (clockwise or counter-clockwise) will change them to portrait, and vice versa.',
            },
            {
                question: 'Is the rotation permanent once saved?',
                answer: 'Yes. Once you download the rotated PDF, the new orientation is saved permanently. Your original file is not modified — a new file is created.',
            },
            {
                question: 'Is it free to rotate a PDF online?',
                answer: 'Yes. Modufile\'s rotate PDF tool is completely free with no limits, no watermarks, and no sign-up. All processing runs locally in your browser.',
            },
            {
                question: 'Can I rotate a PDF on my phone?',
                answer: 'Yes. The tool works in any modern browser on desktop, tablet, or mobile. Simply open it, load your file, and rotate PDF pages in seconds.',
            },
            {
                question: 'Does this tool also flip pages horizontally?',
                answer: 'No. This tool rotates pages (changes orientation). Horizontal or vertical flipping (mirroring) is a different operation and is not currently supported.',
            },
        ],
    },

    'pdf-redact': {
        about: 'Modufile\'s Redact PDF tool performs true, permanent redaction — it physically removes the underlying text and image data from the PDF content stream using the MuPDF engine compiled to WebAssembly. Unlike simple black-box overlays that can be removed, Modufile\'s redaction makes the content unrecoverable by any tool. You can draw redaction boxes manually on any page or use the Find & Redact feature to search for specific text and redact all occurrences at once. The entire process runs locally in your browser, so sensitive documents are never uploaded to a server. This makes it a strong alternative to paid tools like Adobe Acrobat\'s redaction tool, offering a free, privacy-focused PDF redaction tool for anyone who needs to black out text, remove personal information, or permanently redact sensitive data in a PDF.',
        techSetup: [
            { library: 'mupdf (WASM)', purpose: 'Performs true content-stream redaction, permanently removing text and image data from the PDF' },
            { library: 'pdfjs-dist', purpose: 'Renders page previews on canvas and extracts text positions for search-based redaction' },
            { library: 'pdf-lib', purpose: 'Assists with coordinate transformation between display and PDF space' },
        ],
        faqs: [
            {
                question: 'Is this true redaction or just a visual overlay?',
                answer: 'This is true, permanent redaction. Modufile uses MuPDF\'s WASM engine to physically remove the underlying text and image data from the PDF content stream. The redacted content cannot be recovered by any tool — unlike simple overlays, which can be removed with a basic PDF editor.',
            },
            {
                question: 'Can I search for text to redact?',
                answer: 'Yes. Use the "Find & Redact" feature in the sidebar. Enter a search term, and Modufile will highlight all occurrences across the document. You can then redact all of them with a single click, which is especially useful for removing repeated personal information.',
            },
            {
                question: 'What happens to metadata during redaction?',
                answer: 'The current redaction focuses on page content (text and images). Metadata fields like title, author, and subject are preserved. If you need to clear those as well, use the Metadata tool separately.',
            },
            {
                question: 'Can I undo a redaction after saving?',
                answer: 'No. Once you save, the redaction is permanent and irreversible — that is the whole point of true redaction. Always keep a backup of your original file before redacting.',
            },
            {
                question: 'Is my data safe during redaction?',
                answer: 'Yes. The entire process runs in your browser via WebAssembly. Your PDF is never sent to any server. Even the MuPDF engine runs locally on your device, making it safe for redacting sensitive documents like legal files, financial records, or personal IDs.',
            },
            {
                question: 'Can I redact a PDF for free?',
                answer: 'Yes. Modufile\'s PDF redaction tool is completely free with no daily limits, no watermarks, and no account required. Adobe Acrobat\'s redaction tool requires a paid Pro subscription — Modufile provides the same true-redaction capability at no cost.',
            },
            {
                question: 'Can I redact images in the PDF?',
                answer: 'Yes. You can draw redaction boxes over any area of the page, including images. The tool will permanently remove the image data under the redaction area from the content stream.',
            },
            {
                question: 'Can I redact a scanned PDF?',
                answer: 'You can draw manual redaction boxes over any visible content in a scanned PDF. However, the Find & Redact text search feature works only on PDFs with selectable text. For scanned documents, use the manual drawing mode to black out the specific areas you need to redact.',
            },
            {
                question: 'Does redaction change the file size?',
                answer: 'It can. Removing content from the PDF stream may slightly reduce file size. In some cases, the MuPDF engine may reorganize internal structures, which can occasionally result in a slightly different file size than the original.',
            },
            {
                question: 'How is this different from blacking out text in a PDF editor?',
                answer: 'Standard PDF editors add a black rectangle on top of text, but the original data remains in the file and can be copied or extracted. True redaction permanently deletes the data from the PDF content stream, making it impossible to recover.',
            },
        ],
    },

    'pdf-watermark': {
        about: 'Modufile\'s Watermark PDF tool lets you add customizable text watermarks to every page of a PDF document. You can configure the watermark text, font size, color, opacity, and rotation angle — placing it diagonally, horizontally, or at any custom angle. The watermark is drawn as a native vector text overlay using pdf-lib, so the original PDF quality and searchability are fully preserved. Everything runs in your browser with no file uploads. This tool is commonly used to mark documents as "Draft," "Confidential," or "Sample," or to add branding to shared files.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Draws text watermarks onto each page with customizable font, color, opacity, and rotation' },
        ],
        faqs: [
            {
                question: 'What types of watermarks can I add?',
                answer: 'You can add text watermarks with customizable content, font size, color, opacity, and rotation angle. Common examples include "Confidential," "Draft," "Sample," or your company name.',
            },
            {
                question: 'Can I control the position and opacity?',
                answer: 'Yes. You can adjust the opacity so the watermark is subtle (e.g., semi-transparent) and set the rotation angle to place it diagonally or at any orientation you prefer.',
            },
            {
                question: 'Does watermarking rasterize the PDF?',
                answer: 'No. The watermark is added as a vector text overlay using pdf-lib, preserving the original PDF quality and keeping the file fully searchable and selectable.',
            },
            {
                question: 'Can I add an image watermark?',
                answer: 'Currently, only text watermarks are supported. For image-based watermarks (like a logo), you would need to use the Add Image tool to manually place an image on each page.',
            },
            {
                question: 'Is the watermark applied to all pages?',
                answer: 'Yes. The text watermark is applied uniformly to every page in the document, ensuring consistent protection across the entire PDF.',
            },
            {
                question: 'Is the watermark tool free?',
                answer: 'Yes. It is completely free with no limits, no watermarks added by Modufile itself, and no sign-up required.',
            },
            {
                question: 'Can the watermark be removed after saving?',
                answer: 'The watermark becomes part of the PDF content once saved. It cannot be easily removed with standard tools. Always keep a backup of your original unwatermarked file.',
            },
            {
                question: 'Does this work on scanned PDFs?',
                answer: 'Yes. The text watermark is drawn on top of the page content regardless of whether the PDF contains native text or scanned images.',
            },
        ],
    },

    'pdf-flatten': {
        about: 'Modufile\'s Flatten PDF tool converts interactive form fields in a PDF — such as text boxes, checkboxes, dropdowns, and radio buttons — into static page content. After flattening, the filled-in values become permanent, non-editable text embedded in the page. This is useful when you need to share a completed form and prevent further changes, fix display issues in certain viewers, or prepare forms for archival. The tool uses pdf-lib to merge AcroForm fields into the page content, and the entire process runs locally in your browser.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Merges interactive form fields (AcroForm) into static page content' },
        ],
        faqs: [
            {
                question: 'What does "flattening" a PDF mean?',
                answer: 'Flattening merges interactive form fields (text boxes, checkboxes, dropdowns) into the static page content. The filled-in values become permanent text, and the fields can no longer be edited. This is a common requirement when submitting forms to courts, government agencies, or other organizations that require non-editable PDFs.',
            },
            {
                question: 'When should I flatten a PDF?',
                answer: 'Flatten when you need to share a completed form and prevent further edits, when a form is not displaying correctly in some PDF viewers, or when you need to merge multiple filled forms (since form fields with the same name can conflict during merging).',
            },
            {
                question: 'Can I un-flatten a PDF?',
                answer: 'No. Flattening is a one-way operation. The form fields become part of the page content and cannot be separated again. Always keep a backup of your original editable form.',
            },
            {
                question: 'Does flattening change how the form looks?',
                answer: 'No. The visual appearance remains the same — the filled-in values stay exactly where they were. The only difference is that the fields are no longer interactive.',
            },
            {
                question: 'What types of form fields are flattened?',
                answer: 'All standard AcroForm fields are flattened, including text fields, checkboxes, radio buttons, dropdowns, and signature fields. The tool handles the most common form types found in PDF documents.',
            },
            {
                question: 'Is the flatten tool free?',
                answer: 'Yes. Modufile\'s flatten tool is free, runs locally in your browser, and requires no sign-up.',
            },
            {
                question: 'Does my file get uploaded to a server?',
                answer: 'No. All processing runs entirely in your browser using pdf-lib. Your PDF files never leave your device.',
            },
            {
                question: 'Can I flatten annotations as well?',
                answer: 'The tool currently focuses on AcroForm fields. Annotations (highlights, comments, sticky notes) are not flattened by this tool.',
            },
        ],
    },

    'pdf-metadata': {
        about: 'Modufile\'s PDF Metadata Editor lets you view and modify the metadata fields stored in a PDF\'s Info dictionary — including Title, Author, Subject, Keywords, Creator, and Producer. This is useful for removing personal information before sharing a document, adding a descriptive title for accessibility compliance, or updating keywords for document management systems. The tool uses pdf-lib to read and write metadata without touching page content, and runs entirely in your browser with no uploads.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Reads and writes the PDF Info dictionary fields (Title, Author, Subject, Keywords, etc.)' },
        ],
        faqs: [
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
                answer: 'Common reasons include removing personal information (like your name or company) before sharing, setting a proper title for accessibility and screen readers, adding keywords for document management systems, or correcting incorrect author information.',
            },
            {
                question: 'Can I remove all metadata at once?',
                answer: 'Yes. Simply clear all the fields and save the document. This will remove the stored Title, Author, Subject, Keywords, Creator, and Producer values.',
            },
            {
                question: 'Does this remove hidden metadata like XMP?',
                answer: 'This tool edits the standard PDF Info dictionary fields. Extended metadata stored in XMP (Extensible Metadata Platform) streams is not currently modified by this tool.',
            },
            {
                question: 'Is the metadata editor free?',
                answer: 'Yes. It is free, runs locally in your browser, and requires no sign-up.',
            },
            {
                question: 'Is my document uploaded to a server?',
                answer: 'No. All processing runs entirely in your browser. Your PDF and its metadata never leave your device.',
            },
            {
                question: 'Can I view metadata without editing?',
                answer: 'Yes. When you load a PDF, the existing metadata fields are displayed. You can review them without making any changes.',
            },
        ],
    },

    'pdf-extract': {
        about: 'Modufile\'s Extract Pages tool lets you select specific pages from a PDF and save them as a new document. Unlike the Split tool, which offers multiple split modes, the Extract tool always outputs selected pages as a single merged PDF. You can click on page thumbnails to pick any combination of pages — including non-consecutive ones — and they will be compiled in order into a new file. The tool uses pdf-lib for lossless page copying and runs entirely in your browser, making it safe to extract pages from PDFs containing sensitive content.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Copies selected pages into a new PDF document' },
        ],
        faqs: [
            {
                question: 'What is the difference between Extract and Split?',
                answer: 'Extract always outputs selected pages as a single merged PDF. Split offers additional modes like Burst (one PDF per page) and Separate Clusters (one PDF per consecutive group). Use Extract when you just need specific pages in one file.',
            },
            {
                question: 'Can I extract non-consecutive pages?',
                answer: 'Yes. Click on individual page thumbnails to select any combination of pages, even non-consecutive ones. They will be merged into a single output file in the order they appear in the original document.',
            },
            {
                question: 'Does extracting pages reduce quality?',
                answer: 'No. Pages are copied at the PDF structure level using pdf-lib. All fonts, images, and vector graphics are preserved at full quality with no re-encoding.',
            },
            {
                question: 'Can I extract pages from a PDF online for free?',
                answer: 'Yes. Modufile\'s extract tool is completely free with no daily limits or account required. Your files are processed locally in your browser — nothing is uploaded to a server.',
            },
            {
                question: 'Can I extract a single page from a large PDF?',
                answer: 'Yes. Simply select the one page you need and download it as a new single-page PDF. This is the quickest way to extract one page from a PDF without installing any software.',
            },
            {
                question: 'Can I reorder the extracted pages?',
                answer: 'The extracted pages maintain their original order from the source document. If you need to reorder them, use the PDF Organize tool after extracting.',
            },
            {
                question: 'Is there a page count limit?',
                answer: 'No. You can extract pages from PDFs of any length. The only constraint is your device\'s available memory since processing runs locally.',
            },
            {
                question: 'Does extracting modify the original PDF?',
                answer: 'No. The original file is never changed. A new PDF is created containing only the selected pages.',
            },
        ],
    },

    'pdf-remove-pages': {
        about: 'Modufile\'s Remove Pages tool lets you delete specific pages from a PDF document. Select the pages you want to remove by clicking their thumbnails, and the tool creates a new PDF containing only the remaining pages. Your original file is never modified. The tool uses pdf-lib for lossless page copying and runs entirely in your browser, so your documents stay private. This is useful for removing blank pages, cover sheets, appendices, or any unwanted content from a PDF.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Creates a new PDF with all pages except the ones selected for removal' },
        ],
        faqs: [
            {
                question: 'Can I undo after removing pages?',
                answer: 'The tool creates a new file — your original PDF is never modified. If you need the removed pages back, simply use your original file.',
            },
            {
                question: 'Does removing pages affect the remaining pages?',
                answer: 'No. Remaining pages are copied at the structure level and are completely unaffected in quality, layout, or content.',
            },
            {
                question: 'Can I remove multiple non-consecutive pages?',
                answer: 'Yes. Click on the thumbnails of each page you want to remove, regardless of their position. All unselected pages will be preserved in the new file.',
            },
            {
                question: 'Is there a page limit?',
                answer: 'No. You can remove pages from PDFs of any size. Processing runs locally in your browser, so there are no server-imposed restrictions.',
            },
            {
                question: 'Is the remove pages tool free?',
                answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up. Your files are processed locally and never uploaded.',
            },
            {
                question: 'Can I delete and add pages in the same step?',
                answer: 'The Remove Pages tool only removes pages. To add pages from another PDF, use the Merge tool first, then remove any unwanted pages from the combined document.',
            },
            {
                question: 'Does this tool work with scanned PDFs?',
                answer: 'Yes. The tool works with any valid PDF, including scanned documents, since it operates on the page structure rather than the content type.',
            },
        ],
    },

    'pdf-organize': {
        about: 'Modufile\'s PDF Organize tool provides a visual drag-and-drop interface for rearranging, rotating, and deleting pages within a PDF document. Page thumbnails are rendered using pdfjs-dist, and you can drag them to reorder, select pages to delete, or rotate individual pages. The final document is assembled by pdf-lib, preserving full quality. This tool is ideal for reordering pages before printing, cleaning up scanned documents, or organizing combined PDFs. All processing runs locally in your browser.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Reorders, rotates, and removes pages based on user-arranged thumbnails' },
            { library: 'pdfjs-dist', purpose: 'Renders page thumbnails for the visual drag-and-drop editor' },
        ],
        faqs: [
            {
                question: 'What can I do in the organizer?',
                answer: 'You can visually reorder pages by dragging thumbnails, rotate individual pages, delete unwanted pages, and then save the reorganized document — all from a single interface.',
            },
            {
                question: 'Can I add pages from another PDF?',
                answer: 'Not directly in the organizer. Use the Merge tool to combine multiple PDFs first, then use the Organizer to arrange, reorder, and clean up the combined pages.',
            },
            {
                question: 'Can I rotate individual pages here?',
                answer: 'Yes. Unlike the standalone Rotate tool (which rotates all pages), the Organizer lets you rotate specific pages independently while also reordering and deleting.',
            },
            {
                question: 'Does rearranging affect page quality?',
                answer: 'No. Pages are copied and reassembled at the PDF structure level. No content is re-encoded or compressed, so quality is perfectly preserved.',
            },
            {
                question: 'Is the organizer free?',
                answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up. All processing runs in your browser.',
            },
            {
                question: 'Can I use this to add page numbers?',
                answer: 'No. The organizer handles page order, rotation, and deletion. For adding page numbers, use the dedicated PDF Page Numbers tool.',
            },
            {
                question: 'How do I select multiple pages for deletion?',
                answer: 'Click on each page thumbnail you want to delete. Selected pages are visually highlighted. Then confirm deletion to remove them all at once.',
            },
            {
                question: 'Does this tool work with large PDFs?',
                answer: 'Yes. The tool renders thumbnails progressively and can handle large documents. Performance depends on your device\'s memory and processing power since everything runs locally.',
            },
        ],
    },

    'pdf-page-numbers': {
        about: 'Modufile\'s Page Numbers tool adds page number text to every page of a PDF document. You can customize the position, font size, and starting number. The numbers are stamped using embedded standard fonts via pdf-lib, ensuring compatibility across all PDF viewers. The tool runs entirely in your browser with no uploads. It is useful for numbering reports, manuals, legal documents, or any multi-page PDF that needs clear page references.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Stamps page number text onto each page using embedded standard fonts' },
        ],
        faqs: [
            {
                question: 'Where are the page numbers placed?',
                answer: 'Page numbers are added to the bottom center of each page. The position, font size, and starting number can be customized to match your document\'s layout.',
            },
            {
                question: 'Can I skip numbering on certain pages?',
                answer: 'Currently, page numbers are applied to all pages uniformly. For selective numbering or skipping a cover page, use the PDF Editor to manually place numbers on specific pages.',
            },
            {
                question: 'Can I set a custom starting number?',
                answer: 'Yes. You can specify what number to begin with — for example, starting from page 3 if the first two pages are a cover and table of contents.',
            },
            {
                question: 'Does adding page numbers change existing content?',
                answer: 'No. Page numbers are added as a text overlay on top of existing page content. The original layout and content remain unchanged.',
            },
            {
                question: 'What font is used for page numbers?',
                answer: 'Standard PDF fonts such as Helvetica are embedded directly, ensuring the numbers display correctly in any PDF viewer without requiring external fonts.',
            },
            {
                question: 'Is the page numbers tool free?',
                answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up. Processing runs locally in your browser.',
            },
            {
                question: 'Can I add page numbers to a scanned PDF?',
                answer: 'Yes. The tool adds text overlays on top of each page regardless of whether the PDF contains native text or scanned images.',
            },
            {
                question: 'Can I choose the number format?',
                answer: 'The tool uses standard numeric formatting (1, 2, 3...). Custom formats like Roman numerals or "Page X of Y" are not currently supported.',
            },
        ],
    },

    'pdf-resize-pages': {
        about: 'Modufile\'s Resize Pages tool changes the dimensions of PDF pages to standard sizes (A4, Letter, Legal, A3) or custom dimensions. Content is scaled proportionally to fit the new size. The tool uses pdf-lib to modify MediaBox dimensions, and the entire process runs locally in your browser. This is useful when you need to standardize page sizes across a document, prepare a PDF for a specific printer, or convert between paper formats.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Rescales page MediaBox dimensions to standard or custom sizes' },
        ],
        faqs: [
            {
                question: 'What page sizes are supported?',
                answer: 'Common sizes like A4, Letter, Legal, A3, and custom dimensions are supported. Content is scaled proportionally to fit the new size.',
            },
            {
                question: 'Does resizing affect text quality?',
                answer: 'No. Since PDF text and vectors are resolution-independent, resizing preserves full quality. Only embedded raster images may appear slightly different at very different scales.',
            },
            {
                question: 'Can I resize individual pages?',
                answer: 'Currently, the resize applies to all pages in the document. All pages are scaled to the same target dimensions.',
            },
            {
                question: 'Does resizing change the aspect ratio?',
                answer: 'Content is scaled proportionally by default, so the aspect ratio is preserved. The page dimensions change to the target size while content is fitted within.',
            },
            {
                question: 'Can I set custom dimensions?',
                answer: 'Yes. In addition to standard paper sizes, you can enter custom width and height values in points, millimeters, or inches.',
            },
            {
                question: 'Is the resize tool free?',
                answer: 'Yes. It is free, runs locally in your browser, and requires no sign-up.',
            },
            {
                question: 'Is my file uploaded to a server?',
                answer: 'No. All processing runs entirely in your browser. Your PDF never leaves your device.',
            },
        ],
    },

    'pdf-add-text': {
        about: 'Modufile\'s Add Text tool lets you place custom text onto any page of a PDF with configurable font, size, color, and position. Live page previews are rendered using pdfjs-dist, allowing you to visually position text exactly where you need it before saving. The text is drawn using pdf-lib as native PDF text, so it remains fully searchable and selectable. The tool runs entirely in your browser. It is useful for adding notes, labels, headers, footers, or any custom text to existing PDF documents.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Draws text onto PDF pages with configurable font, size, and color' },
            { library: 'pdfjs-dist', purpose: 'Renders live page previews on canvas for positioning text visually' },
        ],
        faqs: [
            {
                question: 'Can I choose the font for the added text?',
                answer: 'Yes. You can select from standard PDF fonts including Helvetica, Times Roman, and Courier in regular and bold variants.',
            },
            {
                question: 'Is the text searchable after adding?',
                answer: 'Yes. Text is added as native PDF text objects, making it fully searchable and selectable in any PDF viewer.',
            },
            {
                question: 'Can I position the text precisely?',
                answer: 'Yes. The tool renders a live preview of each page, allowing you to click and place text at the exact position you want. You can also adjust coordinates manually.',
            },
            {
                question: 'Can I add text to multiple pages?',
                answer: 'Yes. You can navigate between pages and add text to any or all pages in the document.',
            },
            {
                question: 'Does adding text change the existing content?',
                answer: 'No. The text is layered on top of the existing page content. Nothing in the original document is modified or removed.',
            },
            {
                question: 'Is the add text tool free?',
                answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up. Processing runs locally in your browser.',
            },
            {
                question: 'Can I use custom fonts?',
                answer: 'Currently, only standard PDF fonts are supported (Helvetica, Times, Courier). Custom font uploads are not available at this time.',
            },
            {
                question: 'Is my file uploaded to a server?',
                answer: 'No. All processing happens in your browser. Your PDF never leaves your device.',
            },
        ],
    },

    'pdf-add-image': {
        about: 'Modufile\'s Add Image tool lets you embed PNG or JPEG images into any page of a PDF document. You can set the exact position and size of the image using a live page preview rendered by pdfjs-dist. The image is embedded at full quality using pdf-lib. This is useful for adding a logo, stamp, signature image, or any visual element to an existing PDF. The tool runs entirely in your browser, so your files remain private.',
        techSetup: [
            { library: 'pdf-lib', purpose: 'Embeds PNG/JPEG images onto PDF pages at specified coordinates and dimensions' },
            { library: 'pdfjs-dist', purpose: 'Renders live page previews on canvas for positioning images visually' },
        ],
        faqs: [
            {
                question: 'What image formats are supported?',
                answer: 'PNG and JPEG images are supported for embedding into the PDF.',
            },
            {
                question: 'Can I control the position and size?',
                answer: 'Yes. You can set the X/Y coordinates and dimensions using the live preview. The image is embedded at full quality into the PDF.',
            },
            {
                question: 'Can I add images to multiple pages?',
                answer: 'Yes. You can navigate between pages and add images to any page in the document.',
            },
            {
                question: 'Does adding an image affect the existing content?',
                answer: 'No. The image is placed as an overlay on top of the existing page content. Nothing in the original document is modified or removed.',
            },
            {
                question: 'Can I add a signature image to a PDF?',
                answer: 'Yes. You can add a PNG image of your signature and position it precisely on the page. Using a PNG with a transparent background works best for a natural look.',
            },
            {
                question: 'Is the add image tool free?',
                answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.',
            },
            {
                question: 'Is my file uploaded to a server?',
                answer: 'No. All processing happens in your browser. Both your PDF and the image you add never leave your device.',
            },
            {
                question: 'Can I add SVG or GIF images?',
                answer: 'Currently, only PNG and JPEG formats are supported. Convert SVG or GIF images to PNG first using the Image Convert tool, then add them to your PDF.',
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    /*  IMAGE TOOLS                                                        */
    /* ------------------------------------------------------------------ */

    'image-convert': {
        about: 'Modufile\'s Image Convert tool lets you convert images between formats directly in your browser using ImageMagick compiled to WebAssembly. You can convert to and from JPG, PNG, WebP, and AVIF, with input support for additional formats including HEIC, TIFF, BMP, and more. Batch conversion is supported — drop multiple files and convert them all at once. Since everything runs locally, your images are never uploaded to any server. This makes it a privacy-safe alternative to online image converters, especially useful for converting HEIC photos from iPhones, preparing WebP or AVIF images for the web, or batch converting between common image formats.',
        techSetup: [
            { library: '@imagemagick/magick-wasm', purpose: 'Reads images in any format (HEIC, TIFF, BMP, etc.) and writes them in the target format (PNG, JPG, WebP, AVIF)' },
        ],
        faqs: [
            {
                question: 'What formats can I convert between?',
                answer: 'You can convert to JPG, PNG, WebP, and AVIF. Input formats also include HEIC, TIFF, BMP, and many more, all handled by the ImageMagick WASM engine running in your browser.',
            },
            {
                question: 'Is there quality loss during conversion?',
                answer: 'Lossy formats (JPG, WebP, AVIF) involve some compression, but quality is typically excellent at default settings. Converting to PNG is always lossless. You can adjust quality settings to balance file size and visual fidelity.',
            },
            {
                question: 'Can I batch convert multiple images?',
                answer: 'Yes. Drop as many images as you need and they will all be converted to the selected target format in one operation.',
            },
            {
                question: 'Are my images uploaded to a server?',
                answer: 'No. All conversion happens locally in your browser using ImageMagick compiled to WebAssembly. Your images never leave your device.',
            },
            {
                question: 'Can I convert HEIC photos from my iPhone?',
                answer: 'Yes. The tool fully supports HEIC input, which is the default photo format on iPhones. You can convert HEIC to JPG, PNG, or WebP for broader compatibility.',
            },
            {
                question: 'What is the difference between WebP and AVIF?',
                answer: 'Both are modern web-optimized formats offering smaller file sizes than JPG. AVIF generally achieves better compression at the same quality level but has slightly less browser support than WebP. Both are good choices for web images.',
            },
            {
                question: 'Is the image converter free?',
                answer: 'Yes. It is completely free with no limits on the number of conversions, no watermarks, and no sign-up required.',
            },
            {
                question: 'Can I convert images to PDF?',
                answer: 'The Image Convert tool converts between image formats only. To create a PDF from images, use the Merge tool after converting your images to a compatible format.',
            },
        ],
    },

    'image-compress': {
        about: 'Modufile\'s Image Compress tool reduces image file sizes by re-encoding them with adjustable quality settings. It uses ImageMagick compiled to WebAssembly, running entirely in your browser. You can control the compression level and preview the before-and-after comparison to find the right balance between file size and visual quality. Typical reductions are 40\u201380% without noticeable quality loss. This is ideal for optimizing images for websites, email attachments, or storage — all without uploading your photos to any server.',
        techSetup: [
            { library: '@imagemagick/magick-wasm', purpose: 'Re-encodes images with adjustable quality settings and optional resize for file size reduction' },
        ],
        faqs: [
            {
                question: 'How much can file sizes be reduced?',
                answer: 'Typical reductions are 40\u201380% depending on the original image and quality setting. The preview lets you compare before and after so you can find the ideal balance.',
            },
            {
                question: 'Does compression affect image quality?',
                answer: 'Some quality reduction occurs with lossy compression, but at recommended settings the difference is virtually imperceptible to the human eye. You can adjust the quality slider to control the trade-off.',
            },
            {
                question: 'What compression algorithms are used?',
                answer: 'Modufile uses ImageMagick\'s optimized encoders running as WebAssembly, supporting quality control and metadata stripping for maximum size reduction.',
            },
            {
                question: 'Can I compress multiple images at once?',
                answer: 'Yes. Drop multiple images and they will all be compressed with the same quality settings. Batch compression is fully supported.',
            },
            {
                question: 'Are my images uploaded to a server?',
                answer: 'No. All compression happens locally in your browser via WebAssembly. Your images never leave your device.',
            },
            {
                question: 'Is the image compressor free?',
                answer: 'Yes. It is completely free with no daily limits, no watermarks, and no sign-up required.',
            },
            {
                question: 'What image formats can I compress?',
                answer: 'You can compress JPG, PNG, WebP, and other common image formats. The ImageMagick engine handles a wide range of input formats.',
            },
            {
                question: 'Does compression strip metadata (EXIF)?',
                answer: 'Yes. By default, metadata such as EXIF data (camera info, GPS coordinates) is stripped during compression, which further reduces file size and helps protect privacy.',
            },
        ],
    },

    'image-resize': {
        about: 'Modufile\'s Image Resize tool lets you change image dimensions using high-quality Lanczos resampling provided by ImageMagick\'s WASM engine. You can resize to specific pixel dimensions while maintaining or overriding the aspect ratio. The tool also supports center cropping for precise framing. Everything runs locally in your browser, so your images are private. This is useful for preparing images for web uploads, social media profiles, print specifications, or any situation where specific dimensions are required.',
        techSetup: [
            { library: '@imagemagick/magick-wasm', purpose: 'Resizes images using Lanczos resampling and center-crops with configurable dimensions' },
        ],
        faqs: [
            {
                question: 'Can I resize while maintaining the aspect ratio?',
                answer: 'Yes. By default, aspect ratio is preserved when you set one dimension. You can also choose to resize to exact dimensions if needed, which may stretch or crop the image.',
            },
            {
                question: 'What interpolation method is used?',
                answer: 'ImageMagick uses high-quality Lanczos resampling by default, which produces sharp results even when upscaling. This is one of the best resampling algorithms available.',
            },
            {
                question: 'Can I resize multiple images at once?',
                answer: 'Yes. Drop multiple images and they will all be resized to the same target dimensions.',
            },
            {
                question: 'Are my images uploaded to a server?',
                answer: 'No. All resizing happens locally in your browser using ImageMagick compiled to WebAssembly. Your images never leave your device.',
            },
            {
                question: 'Is the image resizer free?',
                answer: 'Yes. It is completely free with no limits on the number of images, no watermarks, and no sign-up required.',
            },
            {
                question: 'Can I resize images to a percentage of the original?',
                answer: 'The tool works with specific pixel dimensions. To resize by percentage, calculate the target dimensions first (e.g., 50% of 1920x1080 = 960x540) and enter those values.',
            },
            {
                question: 'Does resizing increase file size?',
                answer: 'Upscaling can increase file size since more pixels need to be stored. Downscaling typically reduces file size. The output file size also depends on the image format and quality settings.',
            },
            {
                question: 'What output formats are supported?',
                answer: 'The resized image is saved in the same format as the input by default. You can use the Image Convert tool to change formats after resizing if needed.',
            },
        ],
    },

    'image-batch': {
        about: 'Modufile\'s Batch Image Processor lets you chain multiple image operations — resize, grayscale, blur, rotate, flip, and format conversion — and apply them sequentially to a batch of images at once. It uses ImageMagick compiled to WebAssembly, running entirely in your browser. This is ideal for workflows where you need to process a set of images with the same pipeline — for example, resizing and converting a folder of product photos for an e-commerce site, or applying a grayscale filter and resize to a set of scanned documents.',
        techSetup: [
            { library: '@imagemagick/magick-wasm', purpose: 'Executes a configurable pipeline of operations (resize, grayscale, blur, rotate, flip) on each image' },
        ],
        faqs: [
            {
                question: 'What operations can I chain?',
                answer: 'You can chain resize, grayscale, blur, rotate, flip, and format conversion operations. Each operation is applied sequentially to all images in the batch.',
            },
            {
                question: 'Is there a limit on how many images I can process?',
                answer: 'There is no artificial limit. Performance depends on your device\'s RAM and processing power since everything runs locally in your browser.',
            },
            {
                question: 'Are my images uploaded to a server?',
                answer: 'No. All processing happens locally in your browser via WebAssembly. Your images never leave your device.',
            },
            {
                question: 'Can I save and reuse an operation pipeline?',
                answer: 'Currently, pipelines are configured per session. You\'ll need to set up the operations again for a new batch. The settings persist during your current session.',
            },
            {
                question: 'How are the processed images downloaded?',
                answer: 'If multiple files are produced, they are typically packaged into a ZIP file for convenient download.',
            },
            {
                question: 'Is the batch processor free?',
                answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.',
            },
            {
                question: 'Does the order of operations matter?',
                answer: 'Yes. Operations are applied in the order you configure them. For example, resizing before adding blur will produce a different result than blurring before resizing.',
            },
            {
                question: 'What image formats are supported?',
                answer: 'The tool supports all common formats including JPG, PNG, WebP, HEIC, TIFF, BMP, and more via the ImageMagick WASM engine.',
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    /*  OCR                                                                */
    /* ------------------------------------------------------------------ */

    'ocr': {
        about: 'Modufile\'s OCR (Optical Character Recognition) tool extracts text from images using the Tesseract.js engine running in a Web Worker inside your browser. It supports over 100 languages, including English, Spanish, French, German, Chinese, Japanese, Arabic, and more. Since Tesseract.js runs entirely client-side, your images and extracted text never leave your device. This makes it a strong privacy-focused alternative to cloud-based OCR services. The tool is useful for digitizing scanned documents, extracting text from photos of printed material, or converting image-based content into editable text.',
        techSetup: [
            { library: 'tesseract.js', purpose: 'Runs the Tesseract OCR engine in a Web Worker to extract text from images with multi-language support' },
        ],
        faqs: [
            {
                question: 'What languages are supported?',
                answer: 'Tesseract.js supports over 100 languages. The most common — English, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Hindi, and Portuguese — are available by default. Additional language packs are loaded on demand.',
            },
            {
                question: 'How accurate is the OCR?',
                answer: 'Accuracy depends on image quality. Clear, high-resolution scans of printed text typically achieve 95%+ accuracy. Noisy, low-resolution, or handwritten images will have lower accuracy. For best results, use well-lit, high-contrast images.',
            },
            {
                question: 'Can I OCR a multi-page PDF?',
                answer: 'Currently, OCR works on single images. For multi-page PDFs, extract each page as an image first using the PDF tools, then OCR each image individually.',
            },
            {
                question: 'Does OCR run locally?',
                answer: 'Yes. Tesseract.js runs entirely in your browser via a Web Worker. No data is sent to any server. Your images and the extracted text stay completely on your device.',
            },
            {
                question: 'What image formats are supported for OCR?',
                answer: 'The tool accepts common image formats including JPG, PNG, WebP, BMP, and TIFF. For best OCR accuracy, use high-resolution PNG or TIFF images.',
            },
            {
                question: 'Is the OCR tool free?',
                answer: 'Yes. It is completely free with no daily limits, no watermarks, and no sign-up required. Unlike many cloud-based OCR tools that charge per page, Modufile has no such restrictions.',
            },
            {
                question: 'Can OCR extract text from handwritten documents?',
                answer: 'Tesseract.js is primarily optimized for printed text. It may recognize neat handwriting to some degree, but accuracy for handwritten documents is significantly lower than for printed text.',
            },
            {
                question: 'Why is OCR slow on the first run?',
                answer: 'On the first run, Tesseract.js downloads the language model data (a few MB per language). This is cached by the browser for subsequent uses, making follow-up OCR tasks faster.',
            },
            {
                question: 'Can I extract text from a PDF image?',
                answer: 'Yes. If your PDF is image-based (scanned), export the pages as images first, then use the OCR tool to extract the text. This effectively lets you extract text from a PDF image without any server-side processing.',
            },
            {
                question: 'Can I select multiple languages at once?',
                answer: 'Yes. Tesseract.js supports multi-language recognition. If your document contains text in multiple languages, you can select all relevant languages for more accurate extraction.',
            },
        ],
    },

    /* ------------------------------------------------------------------ */
    /*  ADVANCED PDF TOOLS     phase 2                                             */
    /* ------------------------------------------------------------------ */

    // 'pdf-compress': {
    //     about: 'Modufile\'s Compress PDF tool reduces your PDF file size directly in your browser using the MuPDF rendering engine. It performs garbage collection, stream optimization, and object deduplication — removing unused data and compressing internal structures without degrading visual quality. Your files are never uploaded to any server, making this a private and secure alternative to cloud-based PDF compressors.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'WASM-based PDF engine that performs garbage collection, stream compression, and structural optimization' },
    //     ],
    //     faqs: [
    //         { question: 'How does compression work without losing quality?', answer: 'MuPDF removes unused objects, deduplicates embedded resources, and recompresses internal streams. The visual content of your pages remains identical — only the internal file structure is optimized.' },
    //         { question: 'How much can I expect my PDF to shrink?', answer: 'Results vary depending on the original file. PDFs with many images or redundant objects can see 50-80% reduction. Already-optimized PDFs may see minimal change.' },
    //         { question: 'Is my file uploaded to a server?', answer: 'No. Everything runs locally in your browser using WebAssembly. Your PDF never leaves your device.' },
    //     ],
    // },

    // 'pdf-unlock': {
    //     about: 'Modufile\'s Unlock PDF tool removes password protection from encrypted PDF files entirely in your browser. Enter the correct password, and the tool re-saves the document without encryption — giving you an unlocked version you can freely view, print, and edit. Your password is never stored or transmitted anywhere.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Authenticates the PDF with your password and re-saves it without encryption flags' },
    //     ],
    //     faqs: [
    //         { question: 'Is my password stored anywhere?', answer: 'No. Your password exists only in browser memory during the operation. It is never saved to disk, sent to a server, or stored in any persistent storage. Once the operation completes, the password is garbage collected.' },
    //         { question: 'Can I remove protection without knowing the password?', answer: 'No. You must know the correct password to unlock a PDF. This tool does not bypass encryption — it authenticates with your password and creates an unprotected copy.' },
    //     ],
    // },

    // 'pdf-protect': {
    //     about: 'Modufile\'s Protect PDF tool adds AES-256 encryption and password protection to your PDF files directly in your browser. You can set an open password (required to view the document) and an owner password (required to change permissions). All encryption happens client-side using the MuPDF engine — your files and passwords are never sent to any server.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Applies AES-256 encryption with user and owner password support' },
    //     ],
    //     faqs: [
    //         { question: 'What encryption standard is used?', answer: 'MuPDF applies AES-256 encryption, which is the strongest encryption standard supported by the PDF specification. This is the same level of encryption used by financial institutions and government agencies.' },
    //         { question: 'What is the difference between user and owner password?', answer: 'The user password (open password) is required to open and view the PDF. The owner password (permissions password) controls what actions are allowed — printing, copying, editing. A PDF can have both, either, or neither.' },
    //     ],
    // },

    // 'pdf-repair': {
    //     about: 'Modufile\'s Repair PDF tool fixes corrupted or damaged PDF files by loading them through the MuPDF engine, which automatically reconstructs broken cross-reference tables, repairs invalid object streams, and resolves structural issues. The repaired PDF is then re-saved with full garbage collection, producing a clean, optimized file.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Automatically repairs corrupted xref tables, invalid objects, and structural damage during load, then re-saves with full optimization' },
    //     ],
    //     faqs: [
    //         { question: 'What types of damage can be repaired?', answer: 'MuPDF can repair corrupted cross-reference tables, missing or broken page links, invalid object streams, truncated file data, and orphaned resources. However, severely corrupted files where the actual page content data is lost may not be fully recoverable.' },
    //         { question: 'Will the repair change my PDF content?', answer: 'No. The repair process only fixes the internal structure of the PDF. Your pages, text, images, and annotations remain unchanged.' },
    //     ],
    // },

    // 'pdf-pdfa': {
    //     about: 'Modufile\'s PDF/A conversion tool transforms standard PDFs into archival-compliant PDF/A format, which is the ISO standard for long-term document preservation. PDF/A files embed all fonts, use standardized color spaces, and are self-contained — ensuring they render identically decades from now. This format is required by many government agencies, courts, and archival institutions.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Processes the PDF to ensure font embedding, color profile standardization, and structural compliance with PDF/A requirements' },
    //     ],
    //     faqs: [
    //         { question: 'What is PDF/A?', answer: 'PDF/A is an ISO-standardized subset of PDF designed for long-term archival. It requires all fonts to be embedded, forbids encryption and external dependencies, and ensures the document is completely self-contained for future readability.' },
    //         { question: 'When do I need PDF/A?', answer: 'PDF/A is typically required for legal filings, government submissions, academic repositories, corporate records, and any scenario where documents must remain readable and unaltered for years or decades.' },
    //     ],
    // },

    // 'pdf-scan': {
    //     about: 'Modufile\'s Scan to PDF tool lets you capture images from your camera or gallery and combine them into a clean PDF document. Built-in enhancement options include automatic contrast adjustment, grayscale conversion, and brightness correction — all processed locally using HTML5 Canvas. The final PDF is assembled using pdf-lib, with no server involvement.',
    //     techSetup: [
    //         { library: 'Canvas API', purpose: 'Applies image enhancements (contrast, grayscale, brightness) directly in the browser' },
    //         { library: 'pdf-lib', purpose: 'Embeds processed images into a multi-page PDF document' },
    //     ],
    //     faqs: [
    //         { question: 'Can I use my phone camera?', answer: 'Yes. On mobile devices, the "Take Photo" button opens your device camera. You can capture multiple pages and they will be combined into a single PDF in the order shown.' },
    //         { question: 'What image formats are supported?', answer: 'JPEG, PNG, WebP, and most common image formats are supported. The tool processes them through Canvas for enhancement before embedding in the PDF.' },
    //     ],
    // },

    // 'pdf-to-word': {
    //     about: 'Modufile\'s PDF to Word converter extracts text from your PDF using the MuPDF engine and generates an editable .docx file. It detects headings based on font size analysis and preserves basic paragraph structure. This tool works best with text-heavy PDFs — complex layouts, tables, and scanned documents may require manual adjustment after conversion.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Extracts structured text with font metadata (size, position, style) from each PDF page' },
    //         { library: 'docx', purpose: 'Generates a Word document (.docx) with paragraphs, headings, and basic text formatting' },
    //     ],
    //     faqs: [
    //         { question: 'Will the formatting be perfect?', answer: 'PDF to Word conversion is inherently imperfect because PDF is a fixed-layout format while Word is a flow-based format. Text content and basic structure (headings, paragraphs) are preserved, but complex layouts, tables, and multi-column text may need manual adjustment.' },
    //         { question: 'Can I convert scanned PDFs?', answer: 'Scanned PDFs contain images, not text. For best results, run OCR on the scanned PDF first, then convert the OCR output to Word.' },
    //     ],
    // },

    // 'pdf-to-excel': {
    //     about: 'Modufile\'s PDF to Excel tool extracts tabular data from PDFs and generates .xlsx spreadsheet files. It uses MuPDF to extract text with position data, then applies column detection based on X-coordinate clustering to reconstruct table structure. Works best with PDFs containing clear tabular layouts.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Extracts text blocks with precise position coordinates from each PDF page' },
    //         { library: 'xlsx (SheetJS)', purpose: 'Generates Excel spreadsheet files (.xlsx) from extracted tabular data' },
    //     ],
    //     faqs: [
    //         { question: 'How does table detection work?', answer: 'The tool analyzes the X-coordinate positions of text blocks to identify column boundaries. Text blocks aligned at similar horizontal positions are grouped into the same column, reconstructing the original table structure.' },
    //         { question: 'Will all tables be detected?', answer: 'Simple, well-structured tables with consistent column alignment are detected most reliably. Complex tables with merged cells, nested tables, or irregular layouts may require manual cleanup.' },
    //     ],
    // },

    // 'pdf-to-ppt': {
    //     about: 'Modufile\'s PDF to PowerPoint converter renders each PDF page as a high-quality image and embeds it as a full-bleed slide in a .pptx file. Each slide preserves the exact visual appearance of the original page. Note that the resulting slides are image-based — text is not directly editable.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Renders each PDF page as a high-resolution image (150 DPI) using the MuPDF WASM engine' },
    //         { library: 'pptxgenjs', purpose: 'Creates PowerPoint presentations with one image-based slide per PDF page' },
    //     ],
    //     faqs: [
    //         { question: 'Can I edit the text in the PowerPoint slides?', answer: 'No. Each slide is an image of the original PDF page, preserving exact visual fidelity but without editable text. For editable text, use the PDF to Word converter instead.' },
    //         { question: 'What DPI are the slides rendered at?', answer: 'Pages are rendered at 150 DPI, which provides a good balance between image quality and file size. This is sufficient for on-screen presentations and standard printing.' },
    //     ],
    // },

    // 'office-to-pdf': {
    //     about: 'Modufile\'s Office to PDF converter transforms Word, Excel, and PowerPoint files into PDF format using ZetaOffice — the full LibreOffice engine compiled to WebAssembly. This provides desktop-quality conversion fidelity, handling tracked changes, footnotes, charts, embedded objects, and complex formatting correctly. The conversion engine (~50MB) downloads once and is cached for instant subsequent use.',
    //     techSetup: [
    //         { library: 'zetajs (ZetaOffice)', purpose: 'Full LibreOffice engine compiled to WebAssembly — handles all Office format conversions with desktop-quality fidelity' },
    //     ],
    //     faqs: [
    //         { question: 'Why is the first conversion slow?', answer: 'The ZetaOffice WASM engine (~50MB) needs to download on first use. This is cached by the browser, so subsequent conversions start within seconds.' },
    //         { question: 'What Office formats are supported?', answer: 'DOCX, DOC, XLSX, XLS, PPTX, PPT, and their OpenDocument equivalents (ODT, ODS, ODP) are all supported.' },
    //     ],
    // },

    // 'pdf-ocr': {
    //     about: 'Modufile\'s OCR PDF tool makes scanned PDFs searchable by adding an invisible text layer. It renders each page as an image using MuPDF, runs Tesseract.js optical character recognition to detect text, and writes the recognized words back into the PDF as an invisible overlay. The original visual appearance is preserved while enabling text search, selection, and copy.',
    //     techSetup: [
    //         { library: 'mupdf', purpose: 'Renders each PDF page as a high-resolution image (200 DPI) for OCR input' },
    //         { library: 'tesseract.js', purpose: 'Performs optical character recognition on rendered page images with support for 100+ languages' },
    //         { library: 'pdf-lib', purpose: 'Writes the invisible text layer back into the original PDF document' },
    //     ],
    //     faqs: [
    //         { question: 'Will the PDF look different after OCR?', answer: 'No. The original visual appearance is completely preserved. OCR adds an invisible text layer on top — you can search and select text, but the pages look identical.' },
    //         { question: 'Which languages are supported?', answer: 'Tesseract.js supports 100+ languages including English, French, German, Spanish, Chinese, Japanese, Korean, Arabic, Hindi, and many more. Language data (~10MB per language) downloads on first use and is cached locally.' },
    //     ],
    // },
    'pdf-compress': {
        about: 'Modufile\'s Compress PDF tool reduces your PDF file size directly in your browser using the MuPDF rendering engine compiled to WebAssembly. It performs garbage collection, stream recompression, object deduplication, and removal of unused resources — optimizing the internal structure of the file without degrading visual quality. Since all processing happens client-side, your files are never uploaded to any server, making this a private and secure alternative to cloud-based PDF compressors like Smallpdf or Adobe\'s online tool. It works well for shrinking PDFs before email, upload, or archival.',
        techSetup: [
            { library: 'mupdf', purpose: 'WASM-based PDF engine that performs garbage collection, stream compression, and structural optimization' },
        ],
        faqs: [
            { question: 'How does compression work without losing quality?', answer: 'MuPDF removes unused objects, deduplicates embedded resources, and recompresses internal streams. The visual content of your pages — text, images, vectors — remains identical. Only the internal file structure is optimized, which is why there is no visible quality loss.' },
            { question: 'How much can I expect my PDF to shrink?', answer: 'Results vary depending on the original file. PDFs with many images, redundant embedded fonts, or excessive metadata can see 50–80% reduction. Already-optimized PDFs may see minimal change. The tool works best on files that were not previously compressed.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. Everything runs locally in your browser using WebAssembly. Your PDF never leaves your device, which makes it safe for compressing sensitive documents.' },
            { question: 'Does compression remove images or fonts?', answer: 'No. The tool does not remove any visual content. It recompresses internal data streams and removes orphaned objects — data that exists in the file but is not displayed on any page.' },
            { question: 'Can I compress multiple PDF files at once?', answer: 'The tool processes one PDF at a time. For batch compression, process each file individually. Since there are no daily limits, you can compress as many files as needed.' },
            { question: 'Is the compress tool free?', answer: 'Yes. Modufile\'s PDF compressor is completely free with no file size limits, no watermarks, and no sign-up required. Unlike some online tools that restrict compression levels or impose daily caps, Modufile has no such restrictions.' },
            { question: 'Will compressed PDFs work in all PDF viewers?', answer: 'Yes. MuPDF produces standard-compliant PDF output that is fully compatible with all major PDF viewers including Adobe Acrobat, Preview, Chrome, and Edge.' },
            { question: 'Can I compress a scanned PDF?', answer: 'Yes. Scanned PDFs (which are essentially embedded images) can be compressed. However, the reduction depends on whether the images inside the PDF are already heavily compressed. If they are, the gains may be modest.' },
            { question: 'Does compression affect hyperlinks or bookmarks?', answer: 'No. Internal links, bookmarks, and annotations are preserved during compression. The optimization targets unused data and internal stream encoding, not document features.' },
            { question: 'Why is my compressed file barely smaller?', answer: 'If the original PDF was already well-optimized (e.g., exported from a modern tool with compression enabled), there may be little room for further reduction. The tool cannot reduce the size of content that is already efficiently encoded.' },
        ],
    },


    'pdf-unlock': {
        about: 'Modufile\'s Unlock PDF tool removes password protection from encrypted PDF files entirely in your browser. You enter the correct document password, and the MuPDF engine authenticates the file and re-saves it without any encryption flags — producing an unlocked copy you can freely view, print, copy, and edit. Your password is never stored, transmitted, or logged anywhere. This tool does not bypass or crack encryption; it requires the legitimate password. The entire process runs client-side via WebAssembly, making it a secure and private way to remove PDF password protection.',
        techSetup: [
            { library: 'mupdf', purpose: 'Authenticates the PDF with your password and re-saves it without encryption flags' },
        ],
        faqs: [
            { question: 'Is my password stored anywhere?', answer: 'No. Your password exists only in browser memory during the operation. It is never saved to disk, sent to a server, or stored in any persistent storage. Once the operation completes, the password is garbage collected by the browser.' },
            { question: 'Can I remove protection without knowing the password?', answer: 'No. You must know the correct password to unlock a PDF. This tool does not bypass or crack encryption — it authenticates with your password and creates an unprotected copy. This is a security and legal requirement.' },
            { question: 'What types of protection does this remove?', answer: 'The tool removes both the user (open) password and the owner (permissions) password. After unlocking, the resulting PDF has no restrictions on viewing, printing, copying, or editing.' },
            { question: 'Does unlocking change the PDF content?', answer: 'No. The content remains identical. Only the encryption and password metadata are removed. All pages, text, images, and annotations are preserved exactly as they were.' },
            { question: 'Is this legal?', answer: 'Yes, provided you have the right to access the document. If you are the document owner or have been given the password, removing protection for your own use is legitimate. The tool requires the correct password, so it cannot be used to bypass security.' },
            { question: 'Is the unlock tool free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required. Processing runs entirely in your browser.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. The entire operation — authentication, decryption, and re-saving — runs locally in your browser using MuPDF\'s WebAssembly engine. Your PDF and password never leave your device.' },
            { question: 'Can I unlock a PDF with only the owner password?', answer: 'Yes. If you know the owner password, MuPDF can authenticate the document and produce an unrestricted copy. If only a user (open) password is set, you will need that password instead.' },
        ],
    },


    'pdf-protect': {
        about: 'Modufile\'s Protect PDF tool adds AES-256 encryption and password protection to your PDF files directly in your browser. You can set a user password (required to open and view the document) and an owner password (required to change permissions such as printing, copying, and editing). All encryption is performed client-side using the MuPDF engine compiled to WebAssembly — your files and passwords are never sent to any server. AES-256 is the strongest encryption standard supported by the PDF specification and is the same level used by financial and government institutions.',
        techSetup: [
            { library: 'mupdf', purpose: 'Applies AES-256 encryption with user and owner password support' },
        ],
        faqs: [
            { question: 'What encryption standard is used?', answer: 'MuPDF applies AES-256 encryption, which is the strongest encryption standard supported by the PDF specification. This is the same level of encryption used by financial institutions and government agencies for securing sensitive documents.' },
            { question: 'What is the difference between user and owner password?', answer: 'The user password (open password) is required to open and view the PDF. The owner password (permissions password) controls what actions are allowed — such as printing, copying, and editing. A PDF can have both, either, or neither.' },
            { question: 'Are my passwords stored or transmitted?', answer: 'No. Passwords exist only in your browser memory during the encryption process. They are never saved to disk, sent to a server, or logged. Once the encrypted PDF is created, the passwords are garbage collected.' },
            { question: 'Can I set only an owner password without a user password?', answer: 'Yes. You can set just an owner password to restrict permissions (like preventing printing or copying) while still allowing anyone to open and view the document without entering a password.' },
            { question: 'Will the protected PDF work in all viewers?', answer: 'Yes. AES-256 encrypted PDFs are supported by all modern PDF viewers including Adobe Acrobat Reader, Preview on macOS, Chrome, Edge, Firefox, and Foxit Reader.' },
            { question: 'Is the protect tool free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required. Encryption runs entirely in your browser.' },
            { question: 'Can I remove the password later?', answer: 'Yes. Use Modufile\'s Unlock PDF tool to remove password protection. You will need to enter the correct password to unlock the file.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. All encryption processing happens locally in your browser using MuPDF\'s WebAssembly engine. Your PDF, passwords, and the encrypted output never leave your device.' },
            { question: 'How strong is AES-256 encryption?', answer: 'AES-256 is considered virtually unbreakable with current computing technology. It would take billions of years for a brute-force attack to crack a well-chosen AES-256 password, making it the industry standard for top-tier document security.' },
        ],
    },


    'pdf-repair': {
        about: 'Modufile\'s Repair PDF tool fixes corrupted or damaged PDF files by loading them through the MuPDF engine, which automatically reconstructs broken cross-reference tables, repairs invalid object streams, and resolves structural issues. The repaired PDF is then re-saved with full garbage collection, producing a clean, optimized file. This can recover PDFs that were truncated during download, corrupted during transfer, or damaged by software errors. The entire process runs locally in your browser via WebAssembly — your files are never uploaded to any server.',
        techSetup: [
            { library: 'mupdf', purpose: 'Automatically repairs corrupted xref tables, invalid objects, and structural damage during load, then re-saves with full optimization' },
        ],
        faqs: [
            { question: 'What types of damage can be repaired?', answer: 'MuPDF can repair corrupted cross-reference tables, missing or broken page links, invalid object streams, truncated file data, and orphaned resources. However, severely corrupted files where the actual page content data is lost may not be fully recoverable.' },
            { question: 'Will the repair change my PDF content?', answer: 'No. The repair process only fixes the internal structure of the PDF. Your pages, text, images, and annotations remain unchanged. The output is a structurally clean version of the same document.' },
            { question: 'Can this fix PDFs that won\'t open?', answer: 'In many cases, yes. If the file is corrupted but the core page data is intact, MuPDF can rebuild the cross-reference table and internal structure, allowing the file to open normally again. If the file is too severely damaged, some content may be unrecoverable.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. All repair processing runs locally in your browser using MuPDF\'s WebAssembly engine. Your damaged file never leaves your device.' },
            { question: 'Is the repair tool free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.' },
            { question: 'Can I repair a password-protected PDF?', answer: 'You would need to unlock the PDF first (using the correct password) before the repair tool can process it. Use the Unlock PDF tool first, then repair the resulting file.' },
            { question: 'Why does the repaired file have a different size?', answer: 'During repair, MuPDF performs full garbage collection — removing orphaned objects and recompressing streams. This often results in a smaller, cleaner file. In rare cases, the rebuilt structure may be slightly larger.' },
            { question: 'What if the repair doesn\'t fix my file?', answer: 'If the core page content data is missing or overwritten (not just the structural metadata), no repair tool can recover it. In those cases, you may need to obtain a fresh copy of the original file.' },
        ],
    },


    'pdf-pdfa': {
        about: 'Modufile\'s PDF/A Conversion tool transforms standard PDFs into archival-compliant PDF/A format — the ISO standard (ISO 19005) for long-term document preservation. PDF/A files embed all fonts, use standardized color spaces, and are fully self-contained, ensuring they render identically decades from now regardless of the software used to open them. The conversion is handled by the MuPDF engine running locally in your browser via WebAssembly. This format is required by many government agencies, courts, academic repositories, and corporate archival systems. Unlike server-based conversion tools, your documents never leave your device.',
        techSetup: [
            { library: 'mupdf', purpose: 'Processes the PDF to ensure font embedding, color profile standardization, and structural compliance with PDF/A requirements' },
        ],
        faqs: [
            { question: 'What is PDF/A?', answer: 'PDF/A is an ISO-standardized subset of PDF (ISO 19005) designed for long-term archival. It requires all fonts to be embedded, forbids encryption and external dependencies (like linked media), and ensures the document is completely self-contained. This guarantees that the file will render identically regardless of the software or operating system used to open it in the future.' },
            { question: 'When do I need PDF/A?', answer: 'PDF/A is typically required for legal filings, government submissions, court documents, academic repositories, corporate records retention, and any scenario where documents must remain readable and visually unchanged for years or decades. Many e-filing systems explicitly require PDF/A format.' },
            { question: 'What PDF/A version does this tool produce?', answer: 'MuPDF produces PDF/A compliant output. The specific conformance level depends on the content of the source document. For most use cases — legal filings, archival, government submissions — the output meets standard compliance requirements.' },
            { question: 'Does conversion change how my document looks?', answer: 'No. The visual appearance is preserved. The conversion primarily embeds fonts, standardizes color profiles, and removes non-compliant features (like encryption or JavaScript). The pages look the same.' },
            { question: 'Can I convert a scanned PDF to PDF/A?', answer: 'Yes. Scanned PDFs (image-based) can be converted to PDF/A. The images are preserved as-is, and the file structure is modified to meet PDF/A compliance requirements.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. All conversion processing runs locally in your browser via MuPDF\'s WebAssembly engine. Your document never leaves your device.' },
            { question: 'Is the PDF/A conversion tool free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.' },
            { question: 'What is the difference between PDF and PDF/A?', answer: 'Standard PDF allows external dependencies (linked fonts, multimedia, JavaScript) and encryption. PDF/A forbids all of these — everything must be embedded and self-contained. PDF/A also requires specific metadata and color profile standards to ensure long-term readability.' },
            { question: 'Will my hyperlinks still work after conversion?', answer: 'PDF/A allows internal links within the document, but external hyperlinks (URLs) may not function as expected in strict PDF/A viewers since external dependencies are restricted by the standard.' },
        ],
    },


    'pdf-scan': {
        about: 'Modufile\'s Scan to PDF tool lets you capture images from your device camera or upload photos from your gallery and combine them into a clean, multi-page PDF document. Built-in enhancement options include automatic contrast adjustment, grayscale conversion, and brightness correction — all processed locally using the HTML5 Canvas API. The final PDF is assembled using pdf-lib, embedding each processed image as a full page. No server is involved at any step. This is useful for quickly digitizing receipts, notes, whiteboards, or paper documents using just your phone browser.',
        techSetup: [
            { library: 'Canvas API', purpose: 'Applies image enhancements (contrast, grayscale, brightness) directly in the browser' },
            { library: 'pdf-lib', purpose: 'Embeds processed images into a multi-page PDF document' },
        ],
        faqs: [
            { question: 'Can I use my phone camera?', answer: 'Yes. On mobile devices, the "Take Photo" button opens your device camera. You can capture multiple pages one after another, and they will be combined into a single PDF in the order shown.' },
            { question: 'What image formats are supported?', answer: 'JPEG, PNG, WebP, and most common image formats are supported. The tool processes them through the Canvas API for enhancement before embedding into the PDF.' },
            { question: 'Can I reorder the scanned pages?', answer: 'Yes. After capturing or uploading your images, you can drag and drop them to reorder the pages before generating the final PDF.' },
            { question: 'What image enhancements are available?', answer: 'The tool offers automatic contrast adjustment, brightness correction, and grayscale conversion. These help clean up photos of documents by improving readability and reducing noise.' },
            { question: 'Is the scan tool free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.' },
            { question: 'Are my images uploaded to a server?', answer: 'No. All image processing and PDF creation happen locally in your browser. Neither your photos nor the resulting PDF leave your device.' },
            { question: 'Can I add more pages after creating the PDF?', answer: 'Not directly within the scan tool. However, you can use the Merge PDF tool to combine your scanned PDF with additional pages or documents.' },
            { question: 'What quality are the scanned pages?', answer: 'The quality depends on your camera and image source. For best results, ensure good lighting and hold the camera steady. The enhancement filters help improve clarity, but they work best with reasonably well-lit source images.' },
        ],
    },


    'pdf-to-word': {
        about: 'Modufile\'s PDF to Word converter extracts text from your PDF using the MuPDF engine and generates an editable .docx file using the docx library. It analyzes font size data to detect headings and preserves basic paragraph structure. This tool works best with text-heavy, single-column PDFs. Complex layouts with tables, multi-column text, or heavy formatting may require manual adjustment after conversion. Since both MuPDF and the docx generator run in your browser via WebAssembly and JavaScript, your files are never uploaded to a server — unlike most online PDF to Word converters.',
        techSetup: [
            { library: 'mupdf', purpose: 'Extracts structured text with font metadata (size, position, style) from each PDF page' },
            { library: 'docx', purpose: 'Generates a Word document (.docx) with paragraphs, headings, and basic text formatting' },
        ],
        faqs: [
            { question: 'Will the formatting be perfect?', answer: 'PDF to Word conversion is inherently imperfect because PDF is a fixed-layout format while Word is a flow-based format. Text content and basic structure (headings, paragraphs) are preserved, but complex layouts, tables, columns, and precise positioning may need manual adjustment. This is a known limitation across all PDF to Word converters, not just Modufile.' },
            { question: 'Can I convert scanned PDFs?', answer: 'Scanned PDFs contain images rather than selectable text. MuPDF can only extract text that exists as text objects in the PDF. For scanned documents, first run OCR (using Modufile\'s OCR tool) to add a text layer, then convert to Word.' },
            { question: 'How are headings detected?', answer: 'The tool analyzes font size metadata extracted by MuPDF. Text blocks with significantly larger font sizes than the body text are automatically formatted as headings in the Word output.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. Both the MuPDF extraction engine and the docx generator run entirely in your browser. Your PDF and the resulting Word file never leave your device.' },
            { question: 'Are tables preserved during conversion?', answer: 'Table detection is limited. The tool extracts text content but may not perfectly reconstruct table structures. For PDFs with important tables, you may get better results using the PDF to Excel tool or manually adjusting the Word output.' },
            { question: 'Is the PDF to Word converter free?', answer: 'Yes. It is completely free with no daily limits, no watermarks, and no sign-up required. Many alternatives like Adobe Acrobat\'s PDF to Word feature require a paid subscription.' },
            { question: 'What about images in the PDF?', answer: 'The current conversion focuses on text extraction. Embedded images in the PDF are not transferred to the Word document. If you need images, consider copying them separately.' },
            { question: 'Can I convert password-protected PDFs to Word?', answer: 'You would need to unlock the PDF first using Modufile\'s Unlock tool (with the correct password), then convert the unlocked file to Word.' },
            { question: 'Why does my converted document look different from the original?', answer: 'PDF uses absolute positioning for every element on the page, while Word uses a flowing text model. This fundamental difference means the visual layout will shift, even though the text content is accurate. This is a universal challenge with all PDF to Word conversion, as commonly discussed on forums like Reddit and Microsoft Community.' },
        ],
    },


    'pdf-to-excel': {
        about: 'Modufile\'s PDF to Excel tool extracts tabular data from PDFs and generates .xlsx spreadsheet files. It uses MuPDF to extract text blocks with precise position coordinates, then applies column detection based on X-coordinate clustering to reconstruct the original table structure. The resulting spreadsheet is built using SheetJS (xlsx library). This tool works best with PDFs containing clearly structured tables with consistent column alignment — such as financial statements, invoices, reports, and data exports. The entire process runs in your browser, so your files are never sent to a server.',
        techSetup: [
            { library: 'mupdf', purpose: 'Extracts text blocks with precise position coordinates from each PDF page' },
            { library: 'xlsx (SheetJS)', purpose: 'Generates Excel spreadsheet files (.xlsx) from extracted tabular data' },
        ],
        faqs: [
            { question: 'How does table detection work?', answer: 'The tool analyzes the X-coordinate positions of text blocks extracted by MuPDF to identify column boundaries. Text blocks aligned at similar horizontal positions are grouped into the same column, reconstructing the original table structure row by row.' },
            { question: 'Will all tables be detected correctly?', answer: 'Simple, well-structured tables with consistent column alignment are detected most reliably. Complex tables with merged cells, nested tables, or irregular layouts may require manual cleanup in Excel after conversion.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. Both MuPDF and SheetJS run entirely in your browser. Your PDF and the resulting Excel file never leave your device.' },
            { question: 'Is the PDF to Excel converter free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.' },
            { question: 'Can I convert scanned PDFs to Excel?', answer: 'Scanned PDFs contain images, not extractable text. For scanned tables, first run OCR on the document to add a text layer, then use the PDF to Excel tool to extract the tabular data.' },
            { question: 'Does it preserve formulas?', answer: 'No. PDFs do not store spreadsheet formulas — only the displayed values. The tool extracts the visible text and numbers into Excel cells. You would need to re-add any formulas manually.' },
            { question: 'Can I convert multi-page tables?', answer: 'Yes. The tool processes each page and extracts tables from all pages. Each page\'s table data is added to the spreadsheet. Tables that span multiple pages may appear as separate sections and might need manual merging in Excel.' },
            { question: 'Why are some columns misaligned?', answer: 'Column detection is based on X-coordinate clustering of text positions. If the original PDF has inconsistent spacing, overlapping columns, or non-standard layouts, the column boundaries may not be detected perfectly. Manual adjustment in Excel can correct this.' },
        ],
    },


    'pdf-to-ppt': {
        about: 'Modufile\'s PDF to PowerPoint converter renders each PDF page as a high-resolution image (150 DPI) using the MuPDF WASM engine, then embeds each image as a full-bleed slide in a .pptx file using pptxgenjs. Each slide preserves the exact visual appearance of the original PDF page. Note that the resulting slides are image-based — text is not directly editable within PowerPoint. This approach guarantees pixel-perfect visual fidelity, making it ideal for converting reports, handouts, or visual documents into presentation format. The entire process runs in your browser.',
        techSetup: [
            { library: 'mupdf', purpose: 'Renders each PDF page as a high-resolution image (150 DPI) using the MuPDF WASM engine' },
            { library: 'pptxgenjs', purpose: 'Creates PowerPoint presentations with one image-based slide per PDF page' },
        ],
        faqs: [
            { question: 'Can I edit the text in the PowerPoint slides?', answer: 'No. Each slide is an image of the original PDF page, preserving exact visual fidelity but without editable text. This ensures the layout looks exactly like the original. For editable text, convert the PDF to Word instead.' },
            { question: 'What DPI are the slides rendered at?', answer: 'Pages are rendered at 150 DPI, which provides a good balance between image quality and file size. This is sufficient for on-screen presentations and standard printing.' },
            { question: 'Can I add notes or edit slides after conversion?', answer: 'Yes. While the slide background is an image, you can add text boxes, shapes, notes, and other PowerPoint elements on top of the image in any presentation editor.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. Both MuPDF and pptxgenjs run entirely in your browser. Your PDF and the resulting PowerPoint file never leave your device.' },
            { question: 'Is the PDF to PowerPoint converter free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.' },
            { question: 'Will the output file be large?', answer: 'Since each slide is a rendered image, the output file can be larger than the original PDF — especially for documents with many pages. A 20-page PDF at 150 DPI typically produces a PPTX file of 10–30 MB depending on page content.' },
            { question: 'Can I choose a higher resolution?', answer: 'Currently the tool renders at 150 DPI, which is optimized for presentations. Higher DPI settings would significantly increase file size and processing time without noticeable improvement at typical presentation viewing distances.' },
            { question: 'Why image-based slides instead of extracting text?', answer: 'PDF layouts use absolute positioning that doesn\'t map cleanly to PowerPoint\'s slide model. Rendering as images guarantees that every element — text, graphics, charts, tables — appears exactly as it does in the original PDF, without layout distortion.' },
        ],
    },


    'office-to-pdf': {
        about: 'Modufile\'s Office to PDF converter transforms Word, Excel, and PowerPoint files into PDF format using ZetaOffice — the full LibreOffice engine compiled to WebAssembly. This provides desktop-quality conversion fidelity, correctly handling tracked changes, footnotes, charts, embedded objects, complex formatting, and all the nuances that simpler converters miss. It supports DOCX, DOC, XLSX, XLS, PPTX, PPT, and their OpenDocument equivalents (ODT, ODS, ODP). The conversion engine (~50 MB) downloads once and is cached by the browser for instant subsequent use. Since everything runs client-side, your documents are never uploaded to a server — a significant privacy advantage over cloud-based converters.',
        techSetup: [
            { library: 'zetajs (ZetaOffice)', purpose: 'Full LibreOffice engine compiled to WebAssembly — handles all Office format conversions with desktop-quality fidelity' },
        ],
        faqs: [
            { question: 'Why is the first conversion slow?', answer: 'The ZetaOffice WASM engine (~50 MB) needs to download on first use. This is cached by your browser, so subsequent conversions start within seconds. The initial download only happens once.' },
            { question: 'What Office formats are supported?', answer: 'DOCX, DOC, XLSX, XLS, PPTX, PPT, and their OpenDocument equivalents (ODT, ODS, ODP) are all supported. This covers the vast majority of office documents.' },
            { question: 'How good is the conversion quality?', answer: 'ZetaOffice runs the full LibreOffice engine, which means conversion fidelity is equivalent to opening the file in LibreOffice on your desktop and exporting to PDF. This handles tracked changes, footnotes, charts, embedded objects, and complex formatting that simpler converters often break.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. The entire LibreOffice engine runs locally in your browser via WebAssembly. Your Office documents and the resulting PDFs never leave your device.' },
            { question: 'Is the Office to PDF converter free?', answer: 'Yes. It is completely free with no limits, no watermarks, and no sign-up required.' },
            { question: 'Can I convert multiple Word files to PDF at once?', answer: 'The tool processes one document at a time. For batch conversion, process each file individually. There are no daily limits.' },
            { question: 'Will my fonts look correct in the PDF?', answer: 'ZetaOffice embeds available fonts into the PDF. If a specific font is not available in the WASM environment, LibreOffice substitutes a metrically similar font. For best results, use common fonts like Arial, Times New Roman, or Calibri.' },
            { question: 'Does it handle password-protected Office files?', answer: 'Password-protected Office documents are not currently supported. Remove the password in your Office application first, then convert the unprotected file to PDF.' },
            { question: 'Can I convert Excel spreadsheets with charts?', answer: 'Yes. ZetaOffice handles charts, formulas, conditional formatting, and other Excel features. The resulting PDF will render the spreadsheet as it appears when printed, including charts and graphs.' },
            { question: 'What is ZetaOffice?', answer: 'ZetaOffice is a distribution of LibreOffice Technology compiled to WebAssembly by allotropia. It brings the full desktop LibreOffice engine into the browser, enabling client-side document processing with the same quality as the desktop application.' },
        ],
    },


    'pdf-ocr': {
        about: 'Modufile\'s OCR PDF tool makes scanned PDFs searchable by adding an invisible text layer to each page. It renders every page as a high-resolution image (200 DPI) using MuPDF, runs Tesseract.js optical character recognition to detect and position text, and writes the recognized words back into the PDF as an invisible overlay using pdf-lib. The original visual appearance is completely preserved while enabling full-text search, text selection, and copy-paste. This supports over 100 languages and runs entirely in your browser — your documents are never uploaded to any server. It is ideal for making scanned contracts, archived documents, and image-based PDFs searchable.',
        techSetup: [
            { library: 'mupdf', purpose: 'Renders each PDF page as a high-resolution image (200 DPI) for OCR input' },
            { library: 'tesseract.js', purpose: 'Performs optical character recognition on rendered page images with support for 100+ languages' },
            { library: 'pdf-lib', purpose: 'Writes the invisible text layer back into the original PDF document' },
        ],
        faqs: [
            { question: 'Will the PDF look different after OCR?', answer: 'No. The original visual appearance is completely preserved. OCR adds an invisible text layer positioned on top of the existing page images — you can search, select, and copy text, but the pages look identical to the original.' },
            { question: 'Which languages are supported?', answer: 'Tesseract.js supports 100+ languages including English, French, German, Spanish, Chinese, Japanese, Korean, Arabic, Hindi, Portuguese, and many more. Language data (~10 MB per language) downloads on first use and is cached locally by the browser for future use.' },
            { question: 'How accurate is the text recognition?', answer: 'Accuracy depends on image quality within the PDF. Clean, high-resolution scans of printed text typically achieve 95%+ accuracy. Low-resolution scans, handwritten text, or heavily stylized fonts will have lower accuracy.' },
            { question: 'Is my file uploaded to a server?', answer: 'No. MuPDF, Tesseract.js, and pdf-lib all run entirely in your browser. Your scanned PDF, the recognized text, and the output file never leave your device.' },
            { question: 'Is the OCR PDF tool free?', answer: 'Yes. It is completely free with no page limits, no watermarks, and no sign-up required. Many commercial OCR tools charge per page — Modufile has no such restrictions.' },
            { question: 'How long does OCR take?', answer: 'Processing time depends on the number of pages and your device\'s processing power. Expect roughly 5–15 seconds per page on a modern device. The first page may take longer as the language model downloads and loads.' },
            { question: 'Can I OCR a PDF that already has some text?', answer: 'Yes. The tool adds an invisible text layer regardless of existing content. However, if your PDF already contains selectable text, OCR may not be necessary. OCR is most useful for scanned or image-based PDFs where text cannot be selected.' },
            { question: 'Can I select multiple languages for a single document?', answer: 'Yes. Tesseract.js supports multi-language recognition. If your scanned document contains text in multiple languages, select all relevant languages for more accurate extraction across the entire document.' },
            { question: 'What is the invisible text layer?', answer: 'It is a standard PDF feature where text is rendered in "invisible" mode — positioned exactly over the corresponding areas of the page image. PDF viewers can detect and interact with this text (for search, selection, and copying) even though it is not visually displayed. This is the same technique used by Adobe Acrobat\'s OCR feature.' },
            { question: 'Why 200 DPI?', answer: '200 DPI provides a good balance between OCR accuracy and processing speed. Higher DPI yields slightly better recognition for small text but significantly increases processing time and memory usage. For most scanned documents, 200 DPI delivers accurate results.' },
        ],
    },

};
