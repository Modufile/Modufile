'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolFaqs } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { Image as ImageIcon, X, Scaling } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadMultipleAsZip } from '@/lib/core/download';
import { initMagick } from '@/lib/core/magick';
import { ImageMagick, MagickGeometry, MagickFormat, Gravity } from '@imagemagick/magick-wasm';

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview?: string;
    originalWidth?: number;
    originalHeight?: number;
}

type Mode = 'resize' | 'crop';

export default function ImageResizePage() {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [mode, setMode] = useState<Mode>('resize');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMagickReady, setIsMagickReady] = useState(false);

    // Resize Settings
    const [width, setWidth] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');
    const [maintainAspect, setMaintainAspect] = useState(true);

    // Crop Settings (Center Crop for now)
    const [cropWidth, setCropWidth] = useState<number | ''>('');
    const [cropHeight, setCropHeight] = useState<number | ''>('');


    useEffect(() => {
        initMagick().then(() => setIsMagickReady(true));
    }, []);

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const imageFiles: ImageFile[] = [];

        for (const file of newFiles) {
            // Basic object
            const imgFile: ImageFile = {
                id: crypto.randomUUID(),
                file,
                name: file.name,
                size: file.size,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
            };

            // Read dimensions if possible
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise((resolve) => {
                    img.onload = () => {
                        imgFile.originalWidth = img.naturalWidth;
                        imgFile.originalHeight = img.naturalHeight;
                        resolve(null);
                    };
                    img.onerror = () => resolve(null);
                });
            }
            imageFiles.push(imgFile);
        }

        setFiles(prev => [...prev, ...imageFiles]);

        // Auto-fill width/height from first file if empty
        if (imageFiles.length > 0 && width === '') {
            if (imageFiles[0].originalWidth) setWidth(imageFiles[0].originalWidth);
            if (imageFiles[0].originalHeight) setHeight(imageFiles[0].originalHeight);
        }

    }, [width]);

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

    const handleProcess = async () => {
        if (!isMagickReady || files.length === 0) return;
        setIsProcessing(true);

        try {
            const outputFiles: { name: string, blob: Blob }[] = [];

            for (const img of files) {
                const arrayBuffer = await img.file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                ImageMagick.read(bytes, (image) => {
                    if (mode === 'resize') {
                        const targetWidth = Number(width) || image.width;
                        const targetHeight = Number(height) || (maintainAspect ? 0 : image.height); // 0 = calc auto

                        const geometry = new MagickGeometry(targetWidth, targetHeight);
                        if (!maintainAspect) geometry.ignoreAspectRatio = true;

                        image.resize(geometry);
                    } else if (mode === 'crop') {
                        const targetW = Number(cropWidth) || image.width;
                        const targetH = Number(cropHeight) || image.height;
                        // Center crop
                        const geometry = new MagickGeometry(targetW, targetH);
                        image.crop(geometry, Gravity.Center);
                    }

                    image.write(image.format, (data) => {
                        // Pass correct mime type based on format
                        let ext = img.name.split('.').pop() || 'jpg';
                        // Mapping needed if format changed, but here we keep original format usually
                        if (image.format === MagickFormat.Png) ext = 'png';
                        if (image.format === MagickFormat.Jpeg) ext = 'jpg';
                        if (image.format === MagickFormat.WebP) ext = 'webp';

                        const blob = new Blob([data as any], { type: img.file.type });
                        const suffix = mode === 'resize' ? `resized_${width}x${height || 'auto'}` : 'cropped';
                        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}_${suffix}.${ext}`;
                        outputFiles.push({ name: newName, blob });
                    });
                });
            }

            await downloadMultipleAsZip(outputFiles, `${mode}_images`);

        } catch (error) {
            console.error('Processing failed:', error);
            alert('Processing failed. Check console.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Resize & Crop"
            description="Change dimensions or crop your images in bulk."
            parentCategory="Image Tools"
            parentHref="/image"
            faqs={toolFaqs['image-resize']}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Settings</h3>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-zinc-800 rounded-lg">
                        <button
                            onClick={() => setMode('resize')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'resize' ? 'bg-[#3A76F0] text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Resize
                        </button>
                        <button
                            onClick={() => setMode('crop')}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'crop' ? 'bg-[#3A76F0] text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Crop
                        </button>
                    </div>

                    {mode === 'resize' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Width (px)</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                    placeholder="auto"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Height (px)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                    placeholder="auto"
                                    disabled={maintainAspect && width !== ''} // Usually one implies the other in simple UI
                                />
                                {maintainAspect && width !== '' && (
                                    <p className="text-[10px] text-zinc-500 mt-1">Calculated automatically</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="aspect"
                                    checked={maintainAspect}
                                    onChange={(e) => setMaintainAspect(e.target.checked)}
                                    className="rounded border-zinc-700 bg-zinc-800 text-[#3A76F0] focus:ring-[#3A76F0]"
                                />
                                <label htmlFor="aspect" className="text-sm text-zinc-400">Maintain Aspect Ratio</label>
                            </div>
                        </div>
                    )}

                    {mode === 'crop' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Crop Width (px)</label>
                                <input
                                    type="number"
                                    value={cropWidth}
                                    onChange={(e) => setCropWidth(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-medium mb-2 block">Crop Height (px)</label>
                                <input
                                    type="number"
                                    value={cropHeight}
                                    onChange={(e) => setCropHeight(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <p className="text-xs text-zinc-500">
                                Images will be cropped from the center.
                            </p>
                        </div>
                    )}

                    {!isMagickReady && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500">
                            Loading Graphics Engine...
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
                                        <ImageIcon className="w-6 h-6 text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-zinc-100 max-w-[200px] truncate">{file.name}</h3>
                                    <p className="text-sm text-zinc-500">
                                        {file.originalWidth ? `${file.originalWidth}×${file.originalHeight}` : 'Loading...'} • {formatFileSize(file.size)}
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
                        onClick={() => document.getElementById('add-more-resize')?.click()}
                        className="w-full p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm"
                    >
                        + Add more images
                        <input
                            id="add-more-resize"
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
                onAction={handleProcess}
                disabled={!isMagickReady}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <Scaling className="w-4 h-4" />
                        {mode === 'resize' ? 'Resize Images' : 'Crop Images'}
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
