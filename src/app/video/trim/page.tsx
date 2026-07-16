'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { formatFileSize } from '@/lib/core/format';
import { CornerLeftDown, CornerRightDown } from 'lucide-react';
import {
    trimVideo,
    getVideoInfo,
    replaceExtension,
    formatDuration,
    type VideoOutputFormat,
    type VideoInfo,
} from '@/lib/core/video';

export default function VideoTrimPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [info, setInfo] = useState<VideoInfo | null>(null);
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [format, setFormat] = useState<VideoOutputFormat>('mp4');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const inputName = file ? replaceExtension(file.name, format) : `output.${format}`;
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(inputName, '_trimmed');

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const video = newFiles.find(f => f.type.startsWith('video/')) ?? newFiles[0];
        if (!video) return;

        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(video); });
        setFile(video);
        setInfo(null);
        setLoadError(null);
        setStart(0);
        setEnd(0);
        setFormat(video.type.includes('webm') ? 'webm' : 'mp4');

        try {
            const videoInfo = await getVideoInfo(video);
            setInfo(videoInfo);
            setEnd(Math.floor(videoInfo.duration * 100) / 100);
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

    const setStartFromPlayhead = () => {
        const t = videoRef.current?.currentTime ?? 0;
        setStart(Math.floor(t * 100) / 100);
    };

    const setEndFromPlayhead = () => {
        const t = videoRef.current?.currentTime ?? 0;
        setEnd(Math.floor(t * 100) / 100);
    };

    const duration = info?.duration ?? 0;
    const validRange = end > start && start >= 0;
    const canSave = !!file && validRange && !loadError;

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);
        setProgress(0);
        try {
            const blob = await trimVideo(file, {
                start,
                end,
                format,
                onProgress: (p) => setProgress(Math.round(p * 100)),
            });
            return { blob, filename: sanitized };
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="Trim Video"
            description="Cut a clip from a video by start and end time — no upload, no re-render wait."
            parentCategory="Video Tools"
            parentHref="/video"
            about={toolContent['video-trim'].about}
            techSetup={toolContent['video-trim'].techSetup}
            faqs={toolContent['video-trim'].faqs}
            onSave={canSave ? handleSave : undefined}
            saveDisabled={!canSave || isProcessing}
            saveLabel="Trim & Save"
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
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Trim Range (seconds)</span>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[11px] text-zinc-500 block mb-1">Start</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={duration}
                                    step={0.01}
                                    value={start}
                                    onChange={(e) => setStart(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-zinc-500 block mb-1">End</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={duration}
                                    step={0.01}
                                    value={end}
                                    onChange={(e) => setEnd(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={setStartFromPlayhead}
                                disabled={!file}
                                className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 transition-colors disabled:opacity-40"
                            >
                                <CornerLeftDown className="w-3 h-3" /> Start at playhead
                            </button>
                            <button
                                onClick={setEndFromPlayhead}
                                disabled={!file}
                                className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 rounded-md flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 transition-colors disabled:opacity-40"
                            >
                                <CornerRightDown className="w-3 h-3" /> End at playhead
                            </button>
                        </div>
                        {!validRange && file && (
                            <p className="text-[11px] text-yellow-500">End time must be after start time.</p>
                        )}
                        {validRange && (
                            <p className="text-[11px] text-zinc-500">
                                Output clip: <span className="text-zinc-300">{formatDuration(end - start)}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Output Format</span>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as VideoOutputFormat)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                        </select>
                        <p className="text-[11px] text-zinc-600 leading-relaxed">
                            Keeping the same format as the source avoids re-encoding, so trimming is near-instant and lossless.
                        </p>
                    </div>
                </div>
            }
        >
            {!file ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['video/*']} />
            ) : (
                <div className="space-y-4">
                    {previewUrl && (
                        <video
                            ref={videoRef}
                            src={previewUrl}
                            controls
                            className="w-full max-h-[420px] rounded-xl border border-zinc-800 bg-black"
                        />
                    )}

                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-400">
                        <span className="text-zinc-200 font-medium truncate max-w-[260px]">{file.name}</span>
                        <span>{formatFileSize(file.size)}</span>
                        {info && <span>{formatDuration(info.duration)} total</span>}
                        {validRange && (
                            <span className="text-[#3A76F0]">
                                {formatDuration(start)} → {formatDuration(end)}
                            </span>
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
                                <span>Trimming…</span>
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
