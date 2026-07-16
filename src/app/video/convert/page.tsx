'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { formatFileSize } from '@/lib/core/format';
import {
    convertVideo,
    getVideoInfo,
    replaceExtension,
    formatDuration,
    type VideoOutputFormat,
    type QualityPreset,
    type VideoInfo,
} from '@/lib/core/video';

export default function VideoConvertPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [info, setInfo] = useState<VideoInfo | null>(null);
    const [format, setFormat] = useState<VideoOutputFormat>('mp4');
    const [maxHeight, setMaxHeight] = useState(0); // 0 = keep original
    const [quality, setQuality] = useState<QualityPreset>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);

    const inputName = file ? replaceExtension(file.name, format) : `output.${format}`;
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(inputName, '_converted');

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const video = newFiles.find(f => f.type.startsWith('video/')) ?? newFiles[0];
        if (!video) return;

        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(video); });
        setFile(video);
        setInfo(null);
        setLoadError(null);

        try {
            setInfo(await getVideoInfo(video));
        } catch (err) {
            console.error('Failed to read video info:', err);
            setLoadError('Could not read this file — the format or codec may not be supported by your browser.');
        }
    }, []);

    const { files: storedFiles, source, setFiles: setStoredFiles } = useFileStore();
    useEffect(() => {
        if (source === 'homepage' && storedFiles.length > 0) {
            handleFilesAdded(storedFiles);
            setStoredFiles([], 'direct');
        }
    }, [storedFiles, source, handleFilesAdded, setStoredFiles]);

    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    const removeFile = useCallback(() => {
        setFile(null);
        setInfo(null);
        setLoadError(null);
        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    }, []);

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);
        setProgress(0);
        try {
            const blob = await convertVideo(file, {
                format,
                maxHeight: maxHeight || undefined,
                quality,
                onProgress: (p) => setProgress(Math.round(p * 100)),
            });
            return { blob, filename: sanitized };
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Convert Video"
            description="Convert MP4, WebM, MOV and more — hardware-accelerated, in your browser."
            parentCategory="Video Tools"
            parentHref="/video"
            about={toolContent['video-convert'].about}
            techSetup={toolContent['video-convert'].techSetup}
            faqs={toolContent['video-convert'].faqs}
            onSave={file ? handleSave : undefined}
            saveDisabled={!file || isProcessing}
            saveLabel="Convert & Save"
            isProcessing={isProcessing}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={false}
                    acceptedFileTypes={['video/*']}
                />
            }
            sidebar={
                <div className="space-y-5 mt-3">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Output Format</span>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as VideoOutputFormat)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="mp4">MP4 (best compatibility)</option>
                            <option value="webm">WebM (open format)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Resolution</span>
                        <select
                            value={maxHeight}
                            onChange={(e) => setMaxHeight(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value={0}>Keep original</option>
                            <option value={1080}>1080p</option>
                            <option value={720}>720p</option>
                            <option value={480}>480p</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Quality</span>
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value as QualityPreset)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="high">High (larger file)</option>
                            <option value="medium">Medium (balanced)</option>
                            <option value="low">Low (smaller file)</option>
                        </select>
                    </div>

                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                        Conversion uses your browser&apos;s built-in hardware video encoder — nothing is uploaded.
                    </p>
                </div>
            }
        >
            {!file ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['video/*']} />
            ) : (
                <div className="space-y-4">
                    {previewUrl && (
                        <video
                            src={previewUrl}
                            controls
                            className="w-full max-h-[420px] rounded-xl border border-zinc-800 bg-black"
                        />
                    )}

                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-400">
                        <span className="text-zinc-200 font-medium truncate max-w-[260px]">{file.name}</span>
                        <span>{formatFileSize(file.size)}</span>
                        {info && (
                            <>
                                <span>{formatDuration(info.duration)}</span>
                                {info.width && info.height && <span>{info.width}×{info.height}</span>}
                                {!info.hasAudio && <span className="text-yellow-500">no audio track</span>}
                            </>
                        )}
                    </div>

                    {loadError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                            {loadError}
                        </div>
                    )}

                    {isProcessing && (
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Converting…</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-[#3A76F0] transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
