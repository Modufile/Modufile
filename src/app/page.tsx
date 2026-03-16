'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOOLS } from '@/config/tools';
import { TransparencySection } from '@/components/landing/TransparencySection';
import { FaqGrid } from '@/components/landing/FaqGrid';
import { ToolCard } from '@/components/ui';
import { toolContent } from '@/data/tool-faqs';

// Map tools to their designated action category
const actionMap: Record<string, string> = {
  '/pdf/merge': 'Organize',
  '/pdf/split': 'Organize',
  '/pdf/rotate': 'Organize',
  '/pdf/remove-pages': 'Organize',
  '/pdf/organize': 'Organize',
  '/pdf/metadata': 'Edit',
  '/pdf/flatten': 'Edit',
  '/pdf/page-numbers': 'Edit',
  '/pdf/resize-pages': 'Edit',
  '/pdf/editor': 'Edit',
  '/pdf/watermark': 'Security',
  '/pdf/redact': 'Security',
  '/pdf/protect': 'Security',
  '/pdf/unlock': 'Security',
  '/pdf/compress': 'Optimize',
  '/pdf/repair': 'Optimize',
  '/pdf/pdfa': 'Optimize',
  '/pdf/scan': 'Convert',
  '/pdf/pdf-to-word': 'Convert',
  '/pdf/pdf-to-excel': 'Convert',
  '/pdf/office-to-pdf': 'Convert',
  '/pdf/ocr': 'Convert', // or OCR
  '/image/compress': 'Optimize',
  '/image/convert': 'Convert',
  '/image/resize': 'Edit',
  '/image/batch': 'Edit',
  '/ocr': 'Convert',
};

export default function Home() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeAction, setActiveAction] = useState<string>('All');

  const categories = ['All', 'PDF', 'Image', 'OCR'];
  const actions = ['All', 'Organize', 'Edit', 'Convert', 'Security', 'Optimize'];

  // Filter tools based on Category and Action
  const filteredTools = TOOLS.filter(tool => {
    const matchCategory = activeCategory === 'All' || tool.category === activeCategory;
    const toolAction = actionMap[tool.href] || 'Edit';
    const matchAction = activeAction === 'All' || toolAction === activeAction;
    return matchCategory && matchAction;
  });

  // Get tools with importance: 1 for Hero Section
  const heroTools = TOOLS.filter(tool => {
    const key = tool.href.replace(/^\//, '').replace(/\//g, '-');
    return tool.category === 'PDF' && toolContent[key]?.importance === 1;
  });

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Main Content Area */}
      <div className="flex-1">

        {/* Hero Section */}
        <div className="relative pt-20 pb-16 overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">

            {/* Left Side: Headline & Text */}
            <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight animate-in fade-in slide-in-from-bottom-5 duration-700">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                  Modify files.
                </span>
                <br className="hidden sm:block" />
                <span className="text-white"> Privately, in browser.</span>
              </h1>

              <p className="text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                Convert, edit, merge, and transform files instantly. No watermarks. No limits. Your files never leave your device.
              </p>
            </div>

            {/* Right Side: Creative Hero Tools Grid */}
            <div className="lg:w-1/2 w-full pt-8 lg:pt-0 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {heroTools.map((tool, i) => {
                  const ToolIcon = tool.icon;
                  // Make the first card span 2 cols or apply special sizing for a "masonry/featured" feel
                  const isFeatured = i === 0;

                  return (
                    <button
                      key={tool.href}
                      onClick={() => router.push(tool.href)}
                      className={`group relative p-[1px] rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-all duration-300 overflow-hidden text-left shadow-lg ${isFeatured ? 'col-span-2 row-span-2' : 'col-span-1'}`}
                      style={{ animationDelay: `${i * 100 + 300}ms` }}
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-500 rounded-2xl"></div>

                      <div className={`relative flex flex-col gap-3 bg-zinc-950/40 backdrop-blur-md h-full rounded-2xl ${isFeatured ? 'p-6 justify-end min-h-[160px]' : 'p-4 justify-center items-center text-center'}`}>

                        <div className={`rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform duration-300 ${isFeatured ? 'w-10 h-10 mb-2' : 'w-8 h-8 mb-1'}`}>
                          <ToolIcon className={`${isFeatured ? 'w-5 h-5' : 'w-4 h-4'} text-red-400`} />
                        </div>

                        <div>
                          <h3 className={`font-semibold text-zinc-100 group-hover:text-red-400 transition-colors ${isFeatured ? 'text-lg' : 'text-sm'}`}>{tool.title}</h3>
                          {isFeatured && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{tool.description}</p>
                          )}
                        </div>

                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Filter & Tools Section */}
        <div className="px-6 py-12 relative z-10" id="tools">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Dual Filtering UI */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80 backdrop-blur-sm sticky top-24 z-30">
              {/* Category Filter */}
              <div className="flex gap-2 p-1 bg-zinc-950/50 rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto border border-zinc-800/50">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat
                      ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-px h-8 bg-zinc-800 hidden sm:block"></div>

              {/* Action Filter */}
              <div className="flex gap-2 p-1 bg-zinc-950/50 rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto border border-zinc-800/50">
                {actions.map(action => (
                  <button
                    key={action}
                    onClick={() => setActiveAction(action)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeAction === action
                      ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Tools Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[400px]">
              {filteredTools.length > 0 ? (
                filteredTools.map((tool, index) => (
                  <div key={tool.href} className="animate-in fade-in zoom-in-95 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>
                    <ToolCard {...tool} />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="text-xl font-medium text-zinc-300">No tools found</h3>
                  <p className="text-zinc-500 mt-2">Try adjusting your filters to see more tools.</p>
                  <button
                    onClick={() => { setActiveCategory('All'); setActiveAction('All'); }}
                    className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Transparency / Zero-Knowledge Section */}
        <TransparencySection />

        {/* FAQ Grid Section */}
        <FaqGrid />

      </div>
    </div>
  );
}
