'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolFaqs } from '@/data/tool-faqs';
import { FloatingActionBar } from '@/components/tools/FloatingActionBar';
import { Image as ImageIcon, X, Plus, Trash2, ArrowRight } from 'lucide-react';
import { formatFileSize } from '@/lib/core/format';
import { downloadMultipleAsZip } from '@/lib/core/download';
import { initMagick } from '@/lib/core/magick';
import { ImageMagick, MagickFormat, MagickGeometry, Gravity } from '@imagemagick/magick-wasm';

interface ImageFile {
    id: string;
    file: File;
    name: string;
    size: number;
    preview?: string;
}

type OperationType = 'resize' | 'grayscale' | 'blur' | 'rotate' | 'flip';

interface Operation {
    id: string;
    type: OperationType;
    params: any;
}

export default function ImageBatchPage() {
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [operations, setOperations] = useState<Operation[]>([]);
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

    const addOperation = (type: OperationType) => {
        const newOp: Operation = {
            id: crypto.randomUUID(),
            type,
            params: {}
        };
        // Default params
        if (type === 'resize') newOp.params = { width: 800, height: 0 };
        if (type === 'blur') newOp.params = { radius: 10, sigma: 5 };
        if (type === 'rotate') newOp.params = { degrees: 90 };

        setOperations(prev => [...prev, newOp]);
    };

    const updateOperation = (id: string, params: any) => {
        setOperations(prev => prev.map(op => op.id === id ? { ...op, params: { ...op.params, ...params } } : op));
    };

    const removeOperation = (id: string) => {
        setOperations(prev => prev.filter(op => op.id !== id));
    };

    const handleProcess = async () => {
        if (!isMagickReady || files.length === 0) return;
        setIsProcessing(true);

        try {
            const outputFiles: { name: string, blob: Blob }[] = [];

            for (const img of files) {
                const arrayBuffer = await img.file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                ImageMagick.read(bytes, (image) => {
                    // Execute pipeline
                    for (const op of operations) {
                        if (op.type === 'resize') {
                            const { width, height } = op.params;
                            const geo = new MagickGeometry(width || 0, height || 0);
                            if (height === 0) geo.ignoreAspectRatio = false; // preserve aspect if height 0
                            image.resize(geo);
                        } else if (op.type === 'grayscale') {
                            image.grayscale();
                        } else if (op.type === 'blur') {
                            const { radius, sigma } = op.params;
                            image.blur(radius, sigma);
                        } else if (op.type === 'rotate') {
                            image.rotate(op.params.degrees);
                        } else if (op.type === 'flip') {
                            image.flip();
                        }
                    }

                    image.write(image.format, (data) => {
                        let ext = img.name.split('.').pop() || 'jpg';
                        // Keep simple: retain extension unless format explicitly changed (not supported in this simple UI yet)

                        const blob = new Blob([data as any], { type: img.file.type });
                        const newName = `${img.name.substring(0, img.name.lastIndexOf('.'))}_processed.${ext}`;
                        outputFiles.push({ name: newName, blob });
                    });
                });
            }

            await downloadMultipleAsZip(outputFiles, `batch_processed`);

        } catch (error) {
            console.error('Batch failed:', error);
            alert('Batch processing failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Batch Image Processor"
            description="Chain multiple editing steps together."
            parentCategory="Image Tools"
            parentHref="/image"
            faqs={toolFaqs['image-batch']}
            sidebar={
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-6">
                    <h3 className="text-sm font-medium text-zinc-100">Operation Pipeline</h3>

                    <div className="space-y-3">
                        {operations.map((op, index) => (
                            <div key={op.id} className="p-3 bg-zinc-800 rounded-md border border-zinc-700 relative group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2">
                                        <span className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">{index + 1}</span>
                                        {op.type}
                                    </span>
                                    <button onClick={() => removeOperation(op.id)} className="text-zinc-500 hover:text-red-500 p-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>

                                {op.type === 'resize' && (
                                    <div className="flex gap-2 text-xs">
                                        <input
                                            type="number"
                                            placeholder="W"
                                            value={op.params.width}
                                            onChange={(e) => updateOperation(op.id, { width: Number(e.target.value) })}
                                            className="w-1/2 p-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300"
                                        />
                                        <input
                                            type="number"
                                            placeholder="H"
                                            value={op.params.height}
                                            onChange={(e) => updateOperation(op.id, { height: Number(e.target.value) })}
                                            className="w-1/2 p-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300"
                                        />
                                    </div>
                                )}
                                {op.type === 'rotate' && (
                                    <div className="flex gap-2 text-xs">
                                        <input
                                            type="number"
                                            placeholder="Degrees"
                                            value={op.params.degrees}
                                            onChange={(e) => updateOperation(op.id, { degrees: Number(e.target.value) })}
                                            className="w-full p-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300"
                                        />
                                    </div>
                                )}
                                {op.type === 'blur' && (
                                    <div className="flex gap-2 text-xs">
                                        <input
                                            type="number"
                                            placeholder="Radius"
                                            value={op.params.radius}
                                            onChange={(e) => updateOperation(op.id, { radius: Number(e.target.value) })}
                                            className="w-1/2 p-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Sigma"
                                            value={op.params.sigma}
                                            onChange={(e) => updateOperation(op.id, { sigma: Number(e.target.value) })}
                                            className="w-1/2 p-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button onClick={() => addOperation('resize')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                + Resize
                            </button>
                            <button onClick={() => addOperation('grayscale')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                + Grayscale
                            </button>
                            <button onClick={() => addOperation('blur')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                + Blur
                            </button>
                            <button onClick={() => addOperation('rotate')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                + Rotate
                            </button>
                            <button onClick={() => addOperation('flip')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                + Flip
                            </button>
                        </div>
                    </div>

                    {!isMagickReady && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500">
                            Loading Engine...
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
                                    <p className="text-sm text-zinc-500">{formatFileSize(file.size)}</p>
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
                        onClick={() => document.getElementById('add-more-batch')?.click()}
                        className="w-full p-4 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors text-sm"
                    >
                        + Add more images
                        <input
                            id="add-more-batch"
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
                isVisible={files.length > 0 && operations.length > 0}
                isProcessing={isProcessing}
                onAction={handleProcess}
                disabled={!isMagickReady}
                actionLabel={
                    <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        Run {operations.length} Operations
                    </div>
                }
            />
        </ToolPageLayout>
    );
}
