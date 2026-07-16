'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dropzone } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ImportedFilesPanel } from '@/components/tools/ImportedFilesPanel';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { formatFileSize } from '@/lib/core/format';
import { stripImageMetadata, supportsLosslessStrip } from '@/lib/core/exif';
import { MapPin, ShieldCheck } from 'lucide-react';

interface MetadataRow {
    key: string;
    value: string;
    sensitive: boolean;
}

const SENSITIVE_KEYS = /gps|latitude|longitude|altitude|serial|owner|artist|author|creator|location/i;

function formatValue(value: unknown): string {
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString().replace('T', ' ').slice(0, 19);
    if (value instanceof Uint8Array || ArrayBuffer.isView(value)) return `<${(value as Uint8Array).byteLength} bytes>`;
    if (Array.isArray(value)) return value.map(formatValue).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

export default function ExifPage() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rows, setRows] = useState<MetadataRow[]>([]);
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(file?.name ?? 'image.jpg', '_clean');

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        const image = newFiles.find(f => f.type.startsWith('image/')) ?? newFiles[0];
        if (!image) return;

        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(image); });
        setFile(image);
        setRows([]);
        setScanned(false);

        try {
            const exifr = (await import('exifr')).default;
            const data: Record<string, unknown> | undefined = await exifr.parse(image, {
                tiff: true, exif: true, gps: true, xmp: true, iptc: true,
            });
            if (data) {
                const parsed = Object.entries(data)
                    .filter(([, v]) => v != null)
                    .map(([key, value]) => ({
                        key,
                        value: formatValue(value).slice(0, 200),
                        sensitive: SENSITIVE_KEYS.test(key),
                    }))
                    .sort((a, b) => Number(b.sensitive) - Number(a.sensitive));
                setRows(parsed);
            }
        } catch (err) {
            console.warn('Metadata parse failed (file may have none):', err);
        } finally {
            setScanned(true);
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
        setRows([]);
        setScanned(false);
        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    }, []);

    const canStrip = !!file && supportsLosslessStrip(file.type);
    const hasGps = rows.some(r => /gps|latitude|longitude/i.test(r.key));

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        if (!file) throw new Error('No file');
        setIsProcessing(true);
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const stripped = stripImageMetadata(bytes, file.type);
            if (!stripped) throw new Error('Unsupported format');
            return {
                blob: new Blob([stripped as BlobPart], { type: file.type }),
                filename: sanitized,
            };
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ToolPageLayout
            title="View & Remove EXIF"
            description="See what your photos reveal — GPS, camera, dates — and strip it losslessly."
            parentCategory="Image Tools"
            parentHref="/image"
            about={toolContent['image-exif'].about}
            techSetup={toolContent['image-exif'].techSetup}
            faqs={toolContent['image-exif'].faqs}
            onSave={canStrip ? handleSave : undefined}
            saveDisabled={!canStrip || isProcessing}
            saveLabel="Save Clean Copy"
            isProcessing={isProcessing}
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            importedFilesPanel={
                <ImportedFilesPanel
                    files={file ? [{ name: file.name, size: file.size }] : []}
                    onRemoveFile={removeFile}
                    onAddFiles={handleFilesAdded}
                    acceptsMultipleFiles={false}
                    acceptedFileTypes={['image/*']}
                />
            }
            sidebar={
                <div className="space-y-5 mt-3">
                    {file && scanned && (
                        <div className="px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
                            <span className="text-xs text-zinc-500">{rows.length} metadata field{rows.length === 1 ? '' : 's'} found</span>
                        </div>
                    )}

                    {hasGps && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400 leading-relaxed">
                                This photo contains GPS location data. Anyone you share it with can see where it was taken.
                            </p>
                        </div>
                    )}

                    {file && !canStrip && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500">
                            Lossless stripping supports JPEG and PNG. Convert this image first, then strip.
                        </div>
                    )}

                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                        Metadata is removed by dropping whole file segments — your pixels are never re-encoded, so there is zero quality loss.
                    </p>
                </div>
            }
        >
            {!file ? (
                <Dropzone onFilesAdded={handleFilesAdded} acceptedTypes={['image/*']} />
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        {previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt={file.name}
                                className="w-40 h-40 object-cover rounded-xl border border-zinc-800 shrink-0"
                            />
                        )}
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex-1 min-w-0 text-sm text-zinc-400 space-y-1">
                            <p className="text-zinc-200 font-medium truncate">{file.name}</p>
                            <p>{formatFileSize(file.size)} · {file.type || 'unknown type'}</p>
                        </div>
                    </div>

                    {scanned && rows.length === 0 && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                            <p className="text-sm text-green-500">No readable metadata found in this image.</p>
                        </div>
                    )}

                    {rows.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.key} className="border-b border-zinc-800/60 last:border-0">
                                            <td className={`px-4 py-2 font-mono text-xs whitespace-nowrap align-top ${row.sensitive ? 'text-red-400' : 'text-zinc-500'}`}>
                                                {row.sensitive && <MapPin className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                                                {row.key}
                                            </td>
                                            <td className="px-4 py-2 text-zinc-300 break-all">{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </ToolPageLayout>
    );
}
