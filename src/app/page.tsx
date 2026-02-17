'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOOLS } from '@/config/tools';
import { Lock, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Dropzone, ToolCard } from '@/components/ui';
import { useFileStore } from '@/stores/fileStore';
import { formatFileSize } from '@/lib/core/format';

export default function Home() {
  const router = useRouter();
  const { setFiles } = useFileStore();
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleFilesAdded = (files: File[]) => {
    if (files.length === 0) return;
    // For now, simpler to handle one file or batch of same type
    // We'll take the first one to determine type context
    const file = files[0];
    setFiles(files, 'homepage');
    setActiveFile(file);
    setShowMenu(true);
  };

  const fileType = activeFile?.type.includes('pdf') ? 'pdf' : activeFile?.type.includes('image') ? 'image' : 'other';

  const relevantTools = TOOLS.filter(t => {
    if (fileType === 'pdf') return t.category === 'PDF' || t.category === 'OCR';
    if (fileType === 'image') return t.category === 'Image' || t.category === 'OCR';
    return false;
  });

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Action Menu Modal */}
      {showMenu && activeFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${fileType === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {fileType === 'pdf' ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100 truncate max-w-[200px]">{activeFile.name}</h3>
                  <p className="text-xs text-zinc-500">{formatFileSize(activeFile.size)}</p>
                </div>
              </div>
              <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Select Tool</h4>
            <div className="grid grid-cols-1 gap-2">
              {relevantTools.map(tool => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.href}
                    onClick={() => router.push(tool.href)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all text-left group"
                  >
                    <div className={`p-2 rounded-lg ${tool.category === 'PDF' ? 'bg-red-500/10 text-red-500' :
                        tool.category === 'Image' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-purple-500/10 text-purple-500'
                      }`}>
                      <ToolIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-zinc-200 font-medium group-hover:text-white">{tool.title}</span>
                      <span className="block text-xs text-zinc-500">{tool.description}</span>
                    </div>
                  </button>
                );
              })}
              {relevantTools.length === 0 && (
                <p className="text-sm text-zinc-500 py-4 text-center">No specific tools found for this file type.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-6 pb-20 pt-16">
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 tracking-tight animate-in fade-in slide-in-from-bottom-5 duration-700">
            Modify files. Privately, in browser.<br />
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Convert, edit, merge, and transform files instantly. No watermarks. No limits.
          </p>

          <div className="pt-8 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-200">
            {/* Main Homepage Dropzone */}
            <Dropzone
              onFilesAdded={handleFilesAdded}
              className="max-w-xl mx-auto"
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
