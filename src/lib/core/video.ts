/**
 * video.ts — Domain-core wrapper around mediabunny (MPL-2.0).
 *
 * All video/audio processing runs client-side via the WebCodecs API —
 * hardware-accelerated, no ffmpeg WASM payload. Platform-agnostic (Layer 3).
 */

import {
    Input,
    Output,
    Conversion,
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Mp4OutputFormat,
    WebMOutputFormat,
    WavOutputFormat,
    Mp3OutputFormat,
    QUALITY_LOW,
    QUALITY_MEDIUM,
    QUALITY_HIGH,
    type Quality,
} from 'mediabunny';

export type VideoOutputFormat = 'mp4' | 'webm';
export type AudioOutputFormat = 'mp3' | 'wav' | 'm4a';
export type QualityPreset = 'low' | 'medium' | 'high';

export interface VideoInfo {
    /** Duration in seconds. */
    duration: number;
    width: number | null;
    height: number | null;
    hasAudio: boolean;
    mimeType: string;
}

const QUALITY_MAP: Record<QualityPreset, Quality> = {
    low: QUALITY_LOW,
    medium: QUALITY_MEDIUM,
    high: QUALITY_HIGH,
};

export const VIDEO_MIME: Record<VideoOutputFormat, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
};

export const AUDIO_MIME: Record<AudioOutputFormat, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
};

let mp3EncoderRegistered = false;

/** Registers the MP3 encoder extension (WebCodecs has no native MP3 encoder). */
async function ensureMp3Encoder(): Promise<void> {
    if (mp3EncoderRegistered) return;
    const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder');
    registerMp3Encoder();
    mp3EncoderRegistered = true;
}

function makeInput(file: File | Blob): Input {
    return new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
}

function makeVideoOutput(format: VideoOutputFormat): Output {
    return new Output({
        format: format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat(),
        target: new BufferTarget(),
    });
}

async function runConversion(
    conversion: Conversion,
    output: Output,
    mimeType: string,
    onProgress?: (fraction: number) => void,
): Promise<Blob> {
    if (!conversion.isValid) {
        const reasons = conversion.discardedTracks.map(t => t.reason).join(', ');
        throw new Error(`This file cannot be converted in your browser (${reasons || 'no usable tracks'}).`);
    }
    if (onProgress) conversion.onProgress = (p) => onProgress(p);
    await conversion.execute();
    const buffer = (output.target as BufferTarget).buffer;
    if (!buffer) throw new Error('Conversion produced no output.');
    return new Blob([buffer], { type: mimeType });
}

/** Reads duration/dimensions without decoding the whole file. */
export async function getVideoInfo(file: File | Blob): Promise<VideoInfo> {
    const input = makeInput(file);
    try {
        const duration = await input.computeDuration();
        const videoTrack = await input.getPrimaryVideoTrack();
        const audioTrack = await input.getPrimaryAudioTrack();
        return {
            duration,
            width: videoTrack?.displayWidth ?? null,
            height: videoTrack?.displayHeight ?? null,
            hasAudio: audioTrack != null,
            mimeType: await input.getMimeType(),
        };
    } finally {
        input.dispose();
    }
}

export interface ConvertVideoOptions {
    format: VideoOutputFormat;
    /** Constrain output height (e.g. 720). Width follows aspect ratio. Omit to keep original. */
    maxHeight?: number;
    quality?: QualityPreset;
    onProgress?: (fraction: number) => void;
}

export async function convertVideo(file: File | Blob, options: ConvertVideoOptions): Promise<Blob> {
    const output = makeVideoOutput(options.format);
    const conversion = await Conversion.init({
        input: makeInput(file),
        output,
        video: {
            ...(options.maxHeight ? { height: options.maxHeight, fit: 'contain' as const } : {}),
            ...(options.quality ? { bitrate: QUALITY_MAP[options.quality] } : {}),
        },
        showWarnings: false,
    });
    return runConversion(conversion, output, VIDEO_MIME[options.format], options.onProgress);
}

export interface TrimVideoOptions {
    /** Trim start, in seconds. */
    start: number;
    /** Trim end, in seconds. */
    end: number;
    format: VideoOutputFormat;
    onProgress?: (fraction: number) => void;
}

export async function trimVideo(file: File | Blob, options: TrimVideoOptions): Promise<Blob> {
    const output = makeVideoOutput(options.format);
    const conversion = await Conversion.init({
        input: makeInput(file),
        output,
        trim: { start: options.start, end: options.end },
        showWarnings: false,
    });
    return runConversion(conversion, output, VIDEO_MIME[options.format], options.onProgress);
}

export interface ExtractAudioOptions {
    format: AudioOutputFormat;
    onProgress?: (fraction: number) => void;
}

export async function extractAudio(file: File | Blob, options: ExtractAudioOptions): Promise<Blob> {
    if (options.format === 'mp3') await ensureMp3Encoder();

    const format =
        options.format === 'mp3' ? new Mp3OutputFormat() :
        options.format === 'wav' ? new WavOutputFormat() :
        new Mp4OutputFormat();

    const output = new Output({ format, target: new BufferTarget() });
    const conversion = await Conversion.init({
        input: makeInput(file),
        output,
        video: { discard: true },
        showWarnings: false,
    });
    return runConversion(conversion, output, AUDIO_MIME[options.format], options.onProgress);
}

/** Replaces the extension of a filename. */
export function replaceExtension(name: string, newExt: string): string {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    return `${base}.${newExt}`;
}

/** Formats seconds as m:ss or h:mm:ss. */
export function formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}
