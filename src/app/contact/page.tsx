'use client';

/**
 * Contact & Support Page
 * 
 * Redesigned based on "Secure Message" dark theme concept
 */

import { useState } from 'react';
import Link from 'next/link';
import { Send, Lock, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { error?: string }).error || 'Failed to send');
            }
            setIsSubmitted(true);
            setFormData({ name: '', email: '', message: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md w-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800"
                >
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Message Sent</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Your message has been sent. We usually respond within 48 hours.
                    </p>
                    <Link
                        href="/"
                        className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Return Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Back to tools</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row">

                {/* Left Column: Copy */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-24 pt-32 lg:pt-24 bg-[#050505]">
                    <div className="max-w-xl w-full space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium mb-6 border border-blue-500/20">
                                <Lock className="w-3 h-3" />
                                End-to-End Encrypted
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
                                We don't want<br />
                                your data,<br />
                                <span className="text-zinc-500">just your feedback.</span>
                            </h1>
                            <p className="text-lg text-zinc-400 leading-relaxed max-w-md">
                                We can't read your files, and we don't want to.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-24 bg-[#09090B] border-l border-zinc-900">
                    <div className="max-w-md w-full">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                            <div className="mb-8">
                                <span className="text-xs font-mono text-blue-500 uppercase tracking-widest">Get in touch</span>
                                <h2 className="text-2xl font-bold text-white mt-2">Send us a message</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2 ml-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Your name"
                                        className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2 ml-1">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                            placeholder="name@company.com"
                                            className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-2 ml-1">
                                        Message
                                    </label>
                                    <div className="relative group">
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                            required
                                            rows={5}
                                            placeholder="How can we help?"
                                            className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-2.5">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Send Securely
                                            <Send className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" />
                                    <span>256-bit Encrypted</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    <span>Avg. response: &lt; 2 days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
