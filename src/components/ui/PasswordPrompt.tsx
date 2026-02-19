'use client';

/**
 * Password Prompt Modal (§6.6)
 * 
 * Modal dialog for entering PDF passwords.
 * Shows password strength indicator and supports retry on failure.
 * 
 * Usage:
 *   <PasswordPrompt
 *     isOpen={showPasswordModal}
 *     onSubmit={handlePassword}
 *     onClose={() => setShowPasswordModal(false)}
 *   />
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ShieldAlert, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPasswordStrength } from '@/lib/core/pdf-password';

interface PasswordPromptProps {
    isOpen: boolean;
    onSubmit: (password: string) => void | Promise<void>;
    onClose: () => void;
    /** Show error message (e.g. "Incorrect password") */
    error?: string | null;
    /** Mode: 'unlock' for decryption, 'set' for encryption */
    mode?: 'unlock' | 'set';
    /** Loading state while authenticating */
    isLoading?: boolean;
}

export function PasswordPrompt({
    isOpen,
    onSubmit,
    onClose,
    error = null,
    mode = 'unlock',
    isLoading = false,
}: PasswordPromptProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setPassword('');
            setConfirmPassword('');
        }
    }, [isOpen]);

    const strength = mode === 'set' ? getPasswordStrength(password) : null;
    const passwordsMatch = mode === 'set' ? password === confirmPassword : true;

    const canSubmit =
        password.length > 0 &&
        !isLoading &&
        (mode === 'unlock' || (passwordsMatch && password.length >= 4));

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (canSubmit) onSubmit(password);
    }, [canSubmit, password, onSubmit]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    const StrengthIcon = strength === 'strong' ? ShieldCheck : strength === 'medium' ? Shield : ShieldAlert;
    const strengthColor = strength === 'strong' ? 'text-green-400' : strength === 'medium' ? 'text-yellow-400' : 'text-red-400';
    const strengthLabel = strength === 'strong' ? 'Strong' : strength === 'medium' ? 'Medium' : 'Weak';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                    onKeyDown={handleKeyDown}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Lock className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        {mode === 'unlock' ? 'Password Protected' : 'Set Password'}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        {mode === 'unlock'
                                            ? 'This PDF requires a password to open'
                                            : 'Protect your PDF with a password'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            {/* Password input */}
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={mode === 'unlock' ? 'Enter password...' : 'Choose a password...'}
                                    className="w-full px-4 py-3 pr-12 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password strength (set mode only) */}
                            {mode === 'set' && password.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <StrengthIcon className={`w-4 h-4 ${strengthColor}`} />
                                    <span className={`text-sm ${strengthColor}`}>{strengthLabel}</span>
                                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${strength === 'strong' ? 'w-full bg-green-400'
                                                    : strength === 'medium' ? 'w-2/3 bg-yellow-400'
                                                        : 'w-1/3 bg-red-400'
                                                }`}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Confirm password (set mode only) */}
                            {mode === 'set' && (
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password..."
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                                    autoComplete="off"
                                />
                            )}

                            {/* Error message */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-400 flex items-center gap-2"
                                >
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.p>
                            )}

                            {/* Mismatch warning */}
                            {mode === 'set' && confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="text-sm text-yellow-400">Passwords do not match</p>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        {mode === 'unlock' ? 'Unlock PDF' : 'Protect PDF'}
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
