'use client';

import { motion } from 'framer-motion';
import { Shield, Cpu, Zap, Lock } from 'lucide-react';

export function TransparencySection() {
    return (
        <section className="relative py-24 bg-[#09090B] overflow-hidden border-y border-zinc-900">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-[#09090B]"></div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left: Visualization */}
                    <div className="relative">
                        {/* Pipeline Container */}
                        <div className="relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">

                            {/* Animated Connecting Line - Centered on icons (32px container pad + 16px card pad + 20px icon half = 68px) */}
                            <div className="absolute left-[67px] top-12 bottom-12 w-0.5 bg-zinc-800 hidden md:block overflow-hidden">
                                <motion.div
                                    className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-blue-500 to-transparent w-full opacity-50"
                                    animate={{ top: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                                />
                            </div>

                            <div className="space-y-6 relative z-10">
                                {/* Step 1: WASM */}
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-black/80 hover:border-zinc-700 transition-colors relative">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-400 shrink-0 z-10 ring-4 ring-[#09090B]">
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-zinc-200 font-medium text-sm">WASM Sandbox</h3>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider">Isolated Environment</p>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500/50"></div>
                                </div>

                                {/* Step 2: Local Processing */}
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-900/30 bg-blue-950/10 hover:border-blue-800/50 transition-colors relative">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500 shrink-0 z-10 ring-4 ring-[#09090B]">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-blue-100 font-medium text-sm">Local Processing</h3>
                                        <p className="text-blue-400/60 text-xs uppercase tracking-wider">Client-Side Only</p>
                                    </div>
                                    <motion.div
                                        className="ml-auto w-2 h-2 rounded-full bg-blue-500"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    ></motion.div>
                                </div>

                                {/* Step 3: Volatile Memory */}
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-black/80 hover:border-zinc-700 transition-colors relative">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-400 shrink-0 z-10 ring-4 ring-[#09090B]">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-zinc-200 font-medium text-sm">Volatile Memory</h3>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider">No Disk Write</p>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500/50"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Copy */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                                Zero-Knowledge<br />
                            </h2>
                            <p className="text-lg text-zinc-400 leading-relaxed">
                                You don’t need to trust a stranger’s “secure” cloud server. Your files stay on your device. We can’t see them. We don’t want to.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-zinc-800">
                            <div>
                                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-zinc-500" />
                                    Network Silent
                                </h4>
                                <p className="text-sm text-zinc-500">
                                    No HTTP requests are made during processing. Your file never touches cloud.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-zinc-500" />
                                    Ephemeral State
                                </h4>
                                <p className="text-sm text-zinc-500">
                                    Files live in your device's volatile memory and vanish instantly when you close the tab.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
