'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { ImageDown, X, Zap } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadMultipleAsZip } from '@/lib/core/download';
import { initMagick } from '@/lib/core/magick';
import { ImageMagick, MagickFormat, MagickGeometry } from '@imagemagick/magick-wasm';

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview?: string;
    status: 'pending' | 'compressed' | 'error';
    compressedSize?: number;
}

export default function ImageCompressPage() {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [quality, setQuality] = useState(75);
    const [targetFormat, setTargetFormat] = useState<MagickFormat | 'original'>('original');
    const [resizeWidth, setResizeWidth] = useState<number | ''>(''); // Optional width constraint
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
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setFiles(prev => [...prev, ...imageFiles]);
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.preview) URL.revokeObjectURL(file.preview);
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const handleCompress = async () => {
        if (!isMagickReady || files.length === 0) return;
        setIsProcessing(true);

        try {
            const outputFiles: { name: string, blob: Blob }[] = [];

            // Temporary state to show results
            const updatedFiles = [...files];

            for (let i = 0; i < files.length; i++) {
                const img = files[i];
                const arrayBuffer = await img.file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                ImageMagick.read(bytes, (image) => {
                    // Optional Resize
                    if (resizeWidth && typeof resizeWidth === 'number') {
                        const geometry = new MagickGeometry(resizeWidth, 0); // 0 height maintains aspect ratio
                        image.resize(geometry);
                    }

                    // Set Configuration (Quality)
                    image.quality = quality;

                    // Determine Output Format
                    let format = targetFormat === 'original' ? image.format : targetFormat;

                    // Magick WASM write
                    image.write(format, (data) => {
                        // Determine extension
                        let ext = 'jpg'; // default fallback
                        if (format === MagickFormat.Png) ext = 'png';
                        if (format === MagickFormat.WebP) ext = 'webp';
                        if (format === MagickFormat.Avif) ext = 'avif';
                        if (format === MagickFormat.Jpeg) ext = 'jpg';

                        // If original, try to preserve ext or map format to ext
                        if (targetFormat === 'original') {
                            const originalExt = img.name.split('.').pop()?.toLowerCase() || 'jpg';
                            ext = originalExt;
                        }

                        const blob = new Blob([data as any], { type: `image/${ext}` });
                        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}_compressed.${ext}`;

                        outputFiles.push({ name: newName, blob });

                        // Update individual file stats
                        updatedFiles[i] = {
                            ...img,
                            status: 'compressed',
                            compressedSize: blob.size
                        };
                    });
                });
            }

            setFiles(updatedFiles);
            await downloadMultipleAsZip(outputFiles, `compressed_images`);

        } catch (error) {
            console.error('Compression failed:', error);
            alert('Compression failed. Please check console.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Compress Images"
            description="Reduce file size while maintaining quality. Local, secure, and fast."
            parentCategory="Image Tools"
            parentHref="/image"
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Compression Settings</h3>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs text-zinc-500 uppercase font-medium">Quality</label>
                            <span className="text-xs text-[#3A76F0] font-medium">{quality}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-full accent-[#3A76F0]"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            Lower quality = smaller file size.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                            Output Format
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                            value={targetFormat}
                            onChange={(e) => setTargetFormat(e.target.value as any)}
                        >
                            <option value="original">Keep Original</option>
                            <option value={MagickFormat.Jpeg}>JPG (Best Compatibility)</option>
                            <option value={MagickFormat.Png}>PNG (Lossless)</option>
                            <option value={MagickFormat.WebP}>WebP (Best Compression)</option>
                            <option value={MagickFormat.Avif}>AVIF (Next Gen)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">
                            Max Width (Optional)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 1920"
                            value={resizeWidth}
                            onChange={(e) => setResizeWidth(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        />
                        <p className="text-xs text-zinc-500 mt-1">
                            Useful for resizing huge photos for web.
                        </p>
                    </div>

                    {!isMagickReady && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500">
                            Loading Compression Engine...
                        </div>
                    )}
                </div>
            }
        >
            {files.length === 0 ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['image/*']} />
            ) : (
                <div className="space-y-4">
                    {files.map(file => (
                        <div key={file.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center overflow-hidden">
                                    {file.preview ? (
                                        <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageDown className="w-6 h-6 text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-zinc-100 max-w-[200px] truncate">{file.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <span>{formatFileSize(file.size)}</span>
                                        {file.compressedSize && (
                                            <>
                                                <span>→</span>
                                                <span className="text-green-500 font-medium">{formatFileSize(file.compressedSize)}</span>
                                                <span className="text-xs bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                                                    -{Math.round((1 - (file.compressedSize / file.size)) * 100)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
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
                        onClick={() => document.getElementById('add-more-compress')?.click()}
                        className="w-full p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm"
                    >
                        + Add more images
                        <input
                            id="add-more-compress"
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
                onAction={handleCompress}
                disabled={!isMagickReady}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Compress {files.length} Images
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
