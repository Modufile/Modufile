'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadBlob } from '@/lib/core/download';
import { initMagick } from '@/lib/core/magick';
import { ImageMagick, MagickFormat } from '@imagemagick/magick-wasm';

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview?: string;
    status: 'pending' | 'converted' | 'error';
}

const FORMATS = [
    { value: MagickFormat.Jpeg, label: 'JPG', ext: 'jpg' },
    { value: MagickFormat.Png, label: 'PNG', ext: 'png' },
    { value: MagickFormat.WebP, label: 'WebP', ext: 'webp' },
    { value: MagickFormat.Avif, label: 'AVIF', ext: 'avif' },
];

export default function ImageConvertPage() {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [targetFormat, setTargetFormat] = useState(FORMATS[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMagickReady, setIsMagickReady] = useState(false);

    useEffect(() => {
        initMagick().then(() => setIsMagickReady(true));
    }, []);

    const handleFilesAdded = useCallback((newFiles: File[]) => {
        const imageFiles = newFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            status: 'pending' as const,
            // Create preview for browsers that support it, otherwise placeholder
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setFiles(prev => [...prev, ...imageFiles]);
    }, []);

    // Check for files coming from homepage dropzone
    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.preview) URL.revokeObjectURL(file.preview);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const handleConvert = async () => {
        if (!isMagickReady || files.length === 0) return;
        setIsProcessing(true);

        try {
            for (const img of files) {
                const arrayBuffer = await img.file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                // Use ImageMagick to convert
                ImageMagick.read(bytes, (image) => {
                    image.write(targetFormat.value, (data) => {
                        const blob = new Blob([data as any], { type: `image/${targetFormat.ext}` });
                        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}.${targetFormat.ext}`;
                        downloadBlob(blob, newName);
                    });
                });
            }

            // Update status (mock)

            // Update status (mock)
            setFiles(prev => prev.map(f => ({ ...f, status: 'converted' })));

        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Conversion failed. Please check the console for details.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Convert Images"
            description="Convert HEIC, TIFF, PNG, JPG, WebP and more securely in your browser."
            parentCategory="Image Tools"
            parentHref="/image"
            about={toolContent['image-convert'].about}
            techSetup={toolContent['image-convert'].techSetup}
            faqs={toolContent['image-convert'].faqs}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={files.map(f => ({ name: f.name, size: f.size, pageCount: (f as any).pageCount }))}
                    onRemoveFile={(idx) => removeFile(files[idx].id)}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={toolContent['image-convert'].acceptsMultipleFiles}
                    acceptedFileTypes={toolContent['image-convert'].acceptedFileTypes}
                />
            }
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Conversion Settings</h3>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                            Target Format
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {FORMATS.map(fmt => (
                                <button
                                    key={fmt.value}
                                    onClick={() => setTargetFormat(fmt)}
                                    className={`p-3 text-sm rounded-lg border transition-all ${targetFormat.value === fmt.value
                                        ? 'bg-[#3A76F0]/10 border-[#3A76F0] text-[#3A76F0]'
                                        : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isMagickReady && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
                            Initializing Image Engine...
                        </div>
                    )}
                </div>
            }
        >
            {files.length === 0 ? (
                <Dropzone
                    onFilesAdded={handleFilesAdded}
                    acceptedTypes={['image/*']} // Accept all images
                />
            ) : (
                <div className="space-y-4">
                    {files.map(file => (
                        <div key={file.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center overflow-hidden">
                                    {file.preview ? (
                                        <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-zinc-100 max-w-[200px] truncate">{file.name}</h3>
                                    <p className="text-sm text-zinc-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(file.id)}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-500 hover:text-red-500" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => document.getElementById('add-more-input')?.click()}
                        className="w-full p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm"
                    >
                        + Add more images
                        <input
                            id="add-more-input"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))}
                        />
                    </button>
                </div>
            )}

            <FloatingActionBar
                isVisible={files.length > 0}
                isProcessing={isProcessing}
                onAction={handleConvert}
                disabled={!isMagickReady}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Convert {files.length} Images to {targetFormat.label}
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
