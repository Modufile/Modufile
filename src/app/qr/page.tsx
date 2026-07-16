'use client';

import { useState, useEffect } from 'react';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { toolContent } from '@/data/tool-faqs';
import { useOutputFilename } from '@/hooks/useOutputFilename';
import { QrCode } from 'lucide-react';
import type { QRCodeErrorCorrectionLevel } from 'qrcode';

type OutputFormat = 'png' | 'svg';

export default function QrGeneratorPage() {
    const [text, setText] = useState('');
    const [size, setSize] = useState(512);
    const [margin, setMargin] = useState(2);
    const [level, setLevel] = useState<QRCodeErrorCorrectionLevel>('M');
    const [format, setFormat] = useState<OutputFormat>('png');
    const [darkColor, setDarkColor] = useState('#000000');
    const [lightColor, setLightColor] = useState('#ffffff');
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { outputFilename, setOutputFilename, sanitized } = useOutputFilename(`qr-code.${format}`, '');

    // Live preview (debounced)
    useEffect(() => {
        if (!text.trim()) {
            setPreviewSrc(null);
            setError(null);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const QRCode = (await import('qrcode')).default;
                const dataUrl = await QRCode.toDataURL(text, {
                    width: 320,
                    margin,
                    errorCorrectionLevel: level,
                    color: { dark: darkColor, light: lightColor },
                });
                setPreviewSrc(dataUrl);
                setError(null);
            } catch (err) {
                console.error('QR generation failed:', err);
                setPreviewSrc(null);
                setError('Could not generate a QR code for this input — it may be too long for the selected error-correction level.');
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [text, margin, level, darkColor, lightColor]);

    const canSave = !!text.trim() && !error;

    const handleSave = async (): Promise<{ blob: Blob; filename: string }> => {
        const QRCode = (await import('qrcode')).default;
        const opts = {
            margin,
            errorCorrectionLevel: level,
            color: { dark: darkColor, light: lightColor },
        };

        if (format === 'svg') {
            const svg = await QRCode.toString(text, { ...opts, type: 'svg' as const, width: size });
            return {
                blob: new Blob([svg], { type: 'image/svg+xml' }),
                filename: sanitized.endsWith('.svg') ? sanitized : `${sanitized}.svg`,
            };
        }

        const dataUrl = await QRCode.toDataURL(text, { ...opts, width: size });
        const blob = await (await fetch(dataUrl)).blob();
        return {
            blob,
            filename: sanitized.endsWith('.png') ? sanitized : `${sanitized}.png`,
        };
    };

    return (
        <ToolPageLayout
            title="QR Code Generator"
            description="Create QR codes for links, Wi-Fi, and text — generated locally, never logged."
            parentCategory="Utility Tools"
            parentHref="/"
            about={toolContent['qr-generator'].about}
            techSetup={toolContent['qr-generator'].techSetup}
            faqs={toolContent['qr-generator'].faqs}
            onSave={canSave ? handleSave : undefined}
            saveDisabled={!canSave}
            saveLabel="Download QR"
            outputFilename={outputFilename}
            onFilenameChange={setOutputFilename}
            sidebar={
                <div className="space-y-5 mt-3">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Format</span>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as OutputFormat)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="png">PNG (raster)</option>
                            <option value="svg">SVG (vector, scalable)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Size</span>
                            <span className="text-xs text-[#3A76F0] font-medium">{size}px</span>
                        </div>
                        <input
                            type="range"
                            min={128}
                            max={2048}
                            step={64}
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                            className="w-full accent-[#3A76F0]"
                        />
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Error Correction</span>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value as QRCodeErrorCorrectionLevel)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#3A76F0]"
                        >
                            <option value="L">L — smallest code</option>
                            <option value="M">M — balanced</option>
                            <option value="Q">Q — robust</option>
                            <option value="H">H — max (survives logos/damage)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Code</span>
                            <input
                                type="color"
                                value={darkColor}
                                onChange={(e) => setDarkColor(e.target.value)}
                                className="w-full h-9 bg-zinc-800 border border-zinc-700 rounded-md cursor-pointer"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Background</span>
                            <input
                                type="color"
                                value={lightColor}
                                onChange={(e) => setLightColor(e.target.value)}
                                className="w-full h-9 bg-zinc-800 border border-zinc-700 rounded-md cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Quiet Zone</span>
                            <span className="text-xs text-[#3A76F0] font-medium">{margin}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={8}
                            value={margin}
                            onChange={(e) => setMargin(Number(e.target.value))}
                            className="w-full accent-[#3A76F0]"
                        />
                        <p className="text-[11px] text-zinc-600">Blank border around the code — keep at least 2 for reliable scanning.</p>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Enter a URL, Wi-Fi string, or any text…"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#3A76F0] resize-none"
                />

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-center p-10 bg-zinc-900/50 border border-zinc-800 rounded-xl min-h-[360px]">
                    {previewSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewSrc} alt="QR code preview" className="w-80 h-80 rounded-lg" />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-zinc-600">
                            <QrCode className="w-16 h-16" />
                            <p className="text-sm">Type above to generate a QR code</p>
                        </div>
                    )}
                </div>
            </div>
        </ToolPageLayout>
    );
}
