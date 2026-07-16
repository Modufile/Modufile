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
    extractAudio,
    getVideoInfo,
    replaceExtension,
    formatDuration,
    type AudioOutputFormat,
    type VideoInfo,
} from '@/lib/core/video';

export default function ExtractAudioPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [info, setInfo] = useState<VideoInfo | null>(null);
    const [format, setFormat] = useState<AudioOutputFormat>('mp3');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);

    const inputName = file ? replaceExtension(file.name, format) : `output.${format}`;
    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(inputName, '_audio');

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const media = newFiles.find(f => f.type.startsWith('video/') || f.type.startsWith('audio/')) ?? newFiles[0];
        if (!media) return;

        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(media); });
        setFile(media);
        setInfo(null);
        setLoadError(null);

        try {
            setInfo(await getVideoInfo(media));
        } catch (err) {
            console.error('Failed to read media info:', err);
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

    const noAudio = info != null && !info.hasAudio;
    const canSave = !!file && !noAudio && !loadError;

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);
        setProgress(0);
        try {
            const blob = await extractAudio(file, {
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
            title="Extract Audio"
            description="Pull the audio track out of any video as MP3, WAV, or M4A."
            parentCategory="Video Tools"
            parentHref="/video"
            about={toolContent['video-extract-audio'].about}
            techSetup={toolContent['video-extract-audio'].techSetup}
            faqs={toolContent['video-extract-audio'].faqs}
            onSave={canSave ? handleSave : undefined}
            saveDisabled={!canSave || isProcessing}
            saveLabel="Extract Audio"
            isProcessing={isProcessing}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={false}
                    acceptedFileTypes={['video/*', 'audio/*']}
                />
            }
            sidebar={
                <div className="space-y-5 mt-3">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Audio Format</span>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as AudioOutputFormat)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="mp3">MP3 (universal)</option>
                            <option value="m4a">M4A / AAC (best quality-size)</option>
                            <option value="wav">WAV (lossless, large)</option>
                        </select>
                    </div>

                    {noAudio && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500">
                            This video has no audio track to extract.
                        </div>
                    )}

                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                        The audio track is extracted and encoded entirely on your device — the video is never uploaded.
                    </p>
                </div>
            }
        >
            {!file ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['video/*', 'audio/*']} />
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
                                {info.hasAudio ? (
                                    <span className="text-green-500">audio track found</span>
                                ) : (
                                    <span className="text-yellow-500">no audio track</span>
                                )}
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
                                <span>Extracting audio…</span>
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
