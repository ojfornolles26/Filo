/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crop, FlipHorizontal, FlipVertical, Grid, RefreshCw, Check, FileText, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FiloFile, ConversionMode } from '../types';

interface LeftToolsSidebarProps {
  mode: ConversionMode;
  activeCropFile: FiloFile | null;
  cropAspectRatio: 'free' | 'original' | '1:1' | '4:3';
  setCropAspectRatio: (type: 'free' | 'original' | '1:1' | '4:3') => void;
  cropFlipH: boolean;
  setCropFlipH: (val: boolean) => void;
  cropFlipV: boolean;
  setCropFlipV: (val: boolean) => void;
  cropShowGrid: boolean;
  setCropShowGrid: (val: boolean) => void;
  onCropReset: () => void;
  onCropSave: () => void;
  files: FiloFile[];
}

export default function LeftToolsSidebar({
  mode,
  activeCropFile,
  cropAspectRatio,
  setCropAspectRatio,
  cropFlipH,
  setCropFlipH,
  cropFlipV,
  setCropFlipV,
  cropShowGrid,
  setCropShowGrid,
  onCropReset,
  onCropSave,
  files
}: LeftToolsSidebarProps) {
  
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activePdf = mode === 'pdf-to-formats' 
    ? (activeCropFile && activeCropFile.type === 'application/pdf' ? activeCropFile : files.find(f => f.type === 'application/pdf'))
    : null;

  return (
    <div className="flex flex-col h-full bg-white/70 dark:bg-stone-950/60 backdrop-blur-md p-6 border border-stone-200/50 dark:border-stone-800/40 rounded-xl justify-between custom-scrollbar shadow-xs transition-all duration-300 hover:shadow-sm">
      
      <div className="flex items-center space-x-2 pb-4 mb-2 border-b border-stone-200/40 dark:border-stone-800/30 shrink-0">
        <div className="h-6 w-6 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-xs select-none">
          <FileText className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="font-brand italic text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-none">
          Filo
        </h2>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === 'images-to-pdf' ? (
          <motion.div
            key="images-to-pdf"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 min-h-0 justify-between space-y-6"
          >
            <div className="space-y-5">
              {/* Header */}
              <div>
                <h3 className="font-sans text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                  Tools
                </h3>
                
                {/* Transform Header Tab selector */}
                <div className="flex border-b border-stone-200/40 dark:border-stone-800/30 mt-2.5 pb-1">
                  <button
                    type="button"
                    className="pb-1 text-xs font-semibold text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 focus:outline-none flex items-center space-x-1"
                  >
                    <Sliders className="h-3 w-3" />
                    <span>Transform</span>
                  </button>
                </div>
              </div>

              {activeCropFile ? (
                <div className="space-y-5">
                  <p className="font-sans text-[10px] text-stone-400 dark:text-stone-500 truncate leading-normal">
                    Editing: <span className="font-semibold text-stone-700 dark:text-stone-300">{activeCropFile.name}</span>
                  </p>

                  {/* Aspect Ratio Presets */}
                  <div className="space-y-2">
                    <span className="block font-sans text-[9px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider">
                      Aspect Ratio
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'free', label: 'Freeform' },
                        { id: 'original', label: 'Original' },
                        { id: '1:1', label: '1:1 Square' },
                        { id: '4:3', label: '4:3 Slide' }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setCropAspectRatio(preset.id as any)}
                          className={`px-2 py-1.5 text-[10.5px] rounded border cursor-pointer font-medium transition-colors focus:outline-none ${
                            cropAspectRatio === preset.id
                              ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold shadow-xs'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotate & Grid */}
                  <div className="space-y-2">
                    <span className="block font-sans text-[9px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider">
                      Rotate & Grid
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCropFlipH(!cropFlipH)}
                        className={`flex-1 p-2 text-[10px] rounded border flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors ${
                          cropFlipH 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                        }`}
                        title="Flip Horizontally"
                      >
                        <FlipHorizontal className="h-3.5 w-3.5" />
                        <span>Horizontal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCropFlipV(!cropFlipV)}
                        className={`flex-1 p-2 text-[10px] rounded border flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors ${
                          cropFlipV 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                        }`}
                        title="Flip Vertically"
                      >
                        <FlipVertical className="h-3.5 w-3.5" />
                        <span>Vertical</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCropShowGrid(!cropShowGrid)}
                        className={`flex-1 p-2 text-[10px] rounded border flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors ${
                          cropShowGrid 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                        }`}
                        title="Toggle Grid Lines"
                      >
                        <Grid className="h-3.5 w-3.5" />
                        <span>Grid</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic mt-4">
                  No active image to crop. Select an image from the queue to edit.
                </p>
              )}
            </div>

            {/* Action buttons */}
            {activeCropFile && (
              <div className="flex gap-2 pt-3 border-t border-stone-200/40 dark:border-stone-800/30">
                <button
                  type="button"
                  onClick={onCropReset}
                  className="flex-1 py-2 text-[11px] rounded border border-stone-200 dark:border-stone-800 bg-white hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400 font-bold flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
                
                <button
                  type="button"
                  onClick={onCropSave}
                  className="flex-1 py-2 text-[11px] rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-bold flex items-center justify-center gap-1 border border-blue-600 dark:border-blue-500 cursor-pointer focus:outline-none transition-colors shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Apply Crop</span>
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pdf-to-formats"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 min-h-0 justify-between space-y-6"
          >
            <div className="space-y-5">
              <div>
                <h3 className="font-sans text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                  Document Specs
                </h3>
              </div>

              {activePdf ? (
                <div className="space-y-4">
                  <div className="p-4 border border-stone-200/50 dark:border-stone-800/40 bg-stone-50/15 dark:bg-stone-950/20 rounded-xl space-y-3">
                    <span className="font-sans text-[10px] font-semibold text-blue-600 dark:text-blue-400 block uppercase tracking-wider">
                      PDF Information
                    </span>
                    
                    <div className="space-y-2 text-xs">
                      <div className="truncate">
                        <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase">Filename</span>
                        <span className="font-semibold text-stone-700 dark:text-stone-300 truncate block">{activePdf.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase">Size</span>
                          <span className="font-semibold text-stone-700 dark:text-stone-300 block">{formatSize(activePdf.size)}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase">Pages</span>
                          <span className="font-semibold text-stone-700 dark:text-stone-300 block">{activePdf.pageCount || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-stone-200/40 dark:border-stone-800/30" />

                  {/* Blueprint visualizer */}
                  <div className="border border-stone-200/50 dark:border-stone-900/40 bg-stone-50/15 dark:bg-stone-950/20 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative w-16 h-22 bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800/40 rounded-lg shadow-xs flex flex-col p-1.5 justify-between">
                      <div className="space-y-1.5 flex flex-col items-stretch">
                        <div className="h-0.5 w-3/4 bg-stone-200 dark:bg-stone-800 rounded" />
                        <div className="h-0.5 w-full bg-stone-200 dark:bg-stone-800 rounded" />
                        <div className="h-0.5 w-2/3 bg-stone-200 dark:bg-stone-800 rounded" />
                      </div>
                    </div>
                    <div>
                      <h5 className="font-sans text-[11px] font-semibold text-stone-700 dark:text-stone-300 leading-none">
                        PDF Extraction Ready
                      </h5>
                      <p className="font-sans text-[9.5px] text-stone-400 dark:text-stone-500 mt-1 leading-normal">
                        The document layer has been parsed and structured for extraction.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic">
                  Please add a PDF document to begin extracting text or images.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
