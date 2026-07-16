'use client';

import { LogoSpinner } from './LogoSpinner';

interface EngineLoadingNoticeProps {
    label?: string;
}

/**
 * Boxed sidebar/card notice shown while a processing engine
 * (WASM binary, worker, or dynamic module) is downloading.
 * Uses the pulsing-logo LogoSpinner for consistent brand feedback.
 */
export function EngineLoadingNotice({ label = 'Loading engine…' }: EngineLoadingNoticeProps) {
    return (
        <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
            <LogoSpinner size={22} label={label} />
        </div>
    );
}
