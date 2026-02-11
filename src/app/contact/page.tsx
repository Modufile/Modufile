'use client';

/**
 * Contact & Support Page
 * 
 * Based on Stitch "Contact & Support" design
 */

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Mail, Copy, Check, Send } from 'lucide-react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        subject: '',
        email: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        setIsSubmitted(true);

        // Reset form
        setFormData({ subject: '', email: '', message: '' });
    };

    const copyEmail = () => {
        navigator.clipboard.writeText('contact@modufile.com');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#09090B] text-zinc-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Message Sent!</h2>
                    <p className="text-zinc-400 mb-6">We&apos;ll get back to you within 24 hours.</p>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090B] text-zinc-100">
            {/* Header */}
            <header className="border-b border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#3A76F0] rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">Modufile</span>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold mb-3">Contact Us</h1>
                    <p className="text-zinc-400">
                        We usually reply within 24 hours.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Subject
                            </label>
                            <select
                                value={formData.subject}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                required
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-[#3A76F0] transition-colors"
                            >
                                <option value="">Select a topic...</option>
                                <option value="bug">Bug Report</option>
                                <option value="privacy">Privacy Concern</option>
                                <option value="feature">Feature Request</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#3A76F0] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Message
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                required
                                rows={6}
                                placeholder="Tell us what's on your mind..."
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#3A76F0] transition-colors resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#3A76F0] hover:bg-[#2563EB] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <h3 className="text-lg font-medium mb-4">Direct Contact</h3>

                            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-zinc-400" />
                                    <span className="text-sm text-zinc-100 font-mono">
                                        contact@modufile.com
                                    </span>
                                </div>
                                <button
                                    onClick={copyEmail}
                                    className="p-2 hover:bg-zinc-700 rounded transition-colors"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-zinc-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <h3 className="text-lg font-medium mb-4">Privacy First</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Your privacy is our priority. We never have access to the files you process
                                &mdash; everything happens locally in your browser. When you contact us,
                                we only see what you choose to share in this form.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800 mt-20">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-sm text-zinc-500">
                            <Link href="/legal/terms" className="hover:text-zinc-300 transition-colors">
                                Terms
                            </Link>
                            <Link href="/legal/privacy" className="hover:text-zinc-300 transition-colors">
                                Privacy
                            </Link>
                        </div>

                        <p className="text-sm text-zinc-600">
                            © {new Date().getFullYear()} Modufile. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
