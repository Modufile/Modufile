'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { FAQ } from '@/data/tool-faqs';

interface FaqSectionProps {
    faqs: FAQ[];
}

export function FaqSection({ faqs }: FaqSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (!faqs || faqs.length === 0) return null;

    return (
        <section className="mt-16 border-t border-zinc-800 pt-12">
            <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-[#3A76F0]" />
                <h2 className="text-lg font-semibold text-zinc-100">
                    Frequently Asked Questions
                </h2>
            </div>

            <div className="space-y-2">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div
                            key={index}
                            className="border border-zinc-800 rounded-lg overflow-hidden transition-colors hover:border-zinc-700"
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                            >
                                <span className="text-sm font-medium text-zinc-200 pr-4">
                                    {faq.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0"
                                >
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    >
                                        <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
