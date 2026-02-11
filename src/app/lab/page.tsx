'use client';

/**
 * Lab Page - WASM Handshake Testing
 * 
 * Developer-only page to verify that all WASM libraries load correctly.
 * Tests: pdf-lib, ffmpeg.wasm, tesseract.js
 */

import { useState } from 'react';
import { FileText, Video, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface TestResult {
    status: TestStatus;
    message: string;
    duration?: number;
}

export default function LabPage() {
    const [pdfTest, setPdfTest] = useState<TestResult>({ status: 'idle', message: '' });
    const [ffmpegTest, setFfmpegTest] = useState<TestResult>({ status: 'idle', message: '' });
    const [ocrTest, setOcrTest] = useState<TestResult>({ status: 'idle', message: '' });

    // Test pdf-lib
    const testPdfLib = async () => {
        setPdfTest({ status: 'loading', message: 'Loading pdf-lib...' });
        const start = performance.now();

        try {
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage([612, 792]);
            const pdfBytes = await pdfDoc.save();

            const duration = Math.round(performance.now() - start);
            setPdfTest({
                status: 'success',
                message: `Created PDF (${pdfBytes.length} bytes)`,
                duration,
            });
        } catch (error) {
            setPdfTest({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    // Test ffmpeg.wasm
    const testFfmpeg = async () => {
        setFfmpegTest({ status: 'loading', message: 'Loading ffmpeg.wasm (this may take a while)...' });
        const start = performance.now();

        try {
            const { FFmpeg } = await import('@ffmpeg/ffmpeg');
            const { toBlobURL } = await import('@ffmpeg/util');

            const ffmpeg = new FFmpeg();

            // Load ffmpeg core from CDN
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            const duration = Math.round(performance.now() - start);
            setFfmpegTest({
                status: 'success',
                message: `FFmpeg loaded successfully`,
                duration,
            });
        } catch (error) {
            setFfmpegTest({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    // Test tesseract.js
    const testTesseract = async () => {
        setOcrTest({ status: 'loading', message: 'Loading Tesseract.js...' });
        const start = performance.now();

        try {
            const Tesseract = await import('tesseract.js');

            // Just verify the worker can be created
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: () => { }, // Silence logs
            });

            await worker.terminate();

            const duration = Math.round(performance.now() - start);
            setOcrTest({
                status: 'success',
                message: 'Tesseract worker created and terminated',
                duration,
            });
        } catch (error) {
            setOcrTest({
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const StatusIcon = ({ status }: { status: TestStatus }) => {
        switch (status) {
            case 'loading':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    🧪 WASM Lab
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                    Verify that all WebAssembly libraries load correctly in your browser.
                </p>

                <div className="space-y-4">
                    {/* PDF-lib Test */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-red-500" />
                                <div>
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">pdf-lib</h3>
                                    <p className="text-sm text-zinc-500">PDF creation and manipulation</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusIcon status={pdfTest.status} />
                                <button
                                    onClick={testPdfLib}
                                    disabled={pdfTest.status === 'loading'}
                                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                        {pdfTest.message && (
                            <p className={`mt-2 text-sm ${pdfTest.status === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                                {pdfTest.message} {pdfTest.duration && `(${pdfTest.duration}ms)`}
                            </p>
                        )}
                    </div>

                    {/* FFmpeg Test */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Video className="w-6 h-6 text-blue-500" />
                                <div>
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">ffmpeg.wasm</h3>
                                    <p className="text-sm text-zinc-500">Video/audio processing (requires SharedArrayBuffer)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusIcon status={ffmpegTest.status} />
                                <button
                                    onClick={testFfmpeg}
                                    disabled={ffmpegTest.status === 'loading'}
                                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                        {ffmpegTest.message && (
                            <p className={`mt-2 text-sm ${ffmpegTest.status === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                                {ffmpegTest.message} {ffmpegTest.duration && `(${ffmpegTest.duration}ms)`}
                            </p>
                        )}
                    </div>

                    {/* Tesseract Test */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Eye className="w-6 h-6 text-purple-500" />
                                <div>
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">tesseract.js</h3>
                                    <p className="text-sm text-zinc-500">OCR text extraction</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusIcon status={ocrTest.status} />
                                <button
                                    onClick={testTesseract}
                                    disabled={ocrTest.status === 'loading'}
                                    className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                        {ocrTest.message && (
                            <p className={`mt-2 text-sm ${ocrTest.status === 'error' ? 'text-red-500' : 'text-zinc-500'}`}>
                                {ocrTest.message} {ocrTest.duration && `(${ocrTest.duration}ms)`}
                            </p>
                        )}
                    </div>
                </div>

                {/* SharedArrayBuffer Check */}
                <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Environment Check</h3>
                    <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                            {typeof SharedArrayBuffer !== 'undefined' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-zinc-600 dark:text-zinc-400">SharedArrayBuffer</span>
                        </li>
                        <li className="flex items-center gap-2">
                            {typeof WebAssembly !== 'undefined' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-zinc-600 dark:text-zinc-400">WebAssembly</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
