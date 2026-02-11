'use client';

/**
 * Modufile Homepage
 * 
 * Based on Stitch design: Hero dropzone + Tool cards grid
 */

import Link from 'next/link';
import { TOOLS } from '@/config/tools';
import { Lock } from 'lucide-react';
import { Dropzone, ToolCard } from '@/components/ui';

// Tool definitions are imported from @/config/tools

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="flex-1 px-6 pb-20 pt-16">
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 tracking-tight animate-in fade-in slide-in-from-bottom-5 duration-700">
            Modify files. Privately.<br />
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            No watermarks. No limits.
          </p>

          <div className="pt-8 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-200">
            <Dropzone
              onFilesAdded={() => window.location.href = '/pdf/merge'}
              className="max-w-xl mx-auto"
            // This homepage dropzone creates a "magic" entry point
            // In a real app we might detect file type and route accordingly
            />
            <p className="text-xs text-zinc-600 mt-4 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Your files never leave your device.
            </p>
          </div>
        </div>

        {/* Tools Grid - Categorized */}
        <div className="max-w-6xl mx-auto space-y-12">
          {['PDF', 'Image', 'OCR'].map(category => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <h2 className="text-xl font-semibold text-zinc-200">{category} Tools</h2>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {TOOLS.filter(t => t.category === category).map((tool, i) => (
                  <ToolCard
                    key={tool.href}
                    {...tool}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
