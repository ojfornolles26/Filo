/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileType, Sparkles, Sliders, ArrowRightLeft, FileDown, Crop, FlipHorizontal, FlipVertical, Grid, RefreshCw, Check } from 'lucide-react';
import { motion } from 'motion/react';
import {
  ConversionMode,
  ImageToPdfOptions,
  PdfToFormatOptions,
  FiloFile
} from '../types';

interface ConfigPanelProps {
  mode: ConversionMode;
  setMode: (mode: ConversionMode) => void;
  pdfOptions: ImageToPdfOptions;
  setPdfOptions: (opts: ImageToPdfOptions) => void;
  formatOptions: PdfToFormatOptions;
  setFormatOptions: (opts: PdfToFormatOptions) => void;
  onConvert: () => void;
  isConverting: boolean;
  hasFiles: boolean;
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
}

export default function ConfigPanel({
  mode,
  setMode,
  pdfOptions,
  setPdfOptions,
  formatOptions,
  setFormatOptions,
  onConvert,
  isConverting,
  hasFiles,
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
  onCropSave
}: ConfigPanelProps) {
  
  const updatePdfOption = <K extends keyof ImageToPdfOptions>(key: K, value: ImageToPdfOptions[K]) => {
    setPdfOptions({ ...pdfOptions, [key]: value });
  };

  const updateFormatOption = <K extends keyof PdfToFormatOptions>(key: K, value: PdfToFormatOptions[K]) => {
    setFormatOptions({ ...formatOptions, [key]: value });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-950 p-5 border border-stone-200 dark:border-stone-800 rounded-lg space-y-4">
      
      {/* Bento Header */}
      <div className="border-b border-stone-100 dark:border-stone-900 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-widest font-extrabold text-[#78716c] dark:text-[#a8a29e]">
            UTILITY STUDIO
          </h3>
          <span className="px-2 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-widest text-blue-600 bg-blue-50/80 border border-blue-250/25 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800/20 font-bold">
            {mode === 'images-to-pdf' ? 'PHOTOS COMPILER' : 'PDF TRANSPILER'}
          </span>
        </div>

        {/* Canva-style utility tool selector inside the sidebar */}
        <div className="grid grid-cols-2 gap-1 bg-stone-100/70 p-1 rounded-lg dark:bg-stone-900/60 border border-stone-200/40 dark:border-stone-800/40">
          <button
            type="button"
            id="tab-photos-to-pdf"
            onClick={() => setMode('images-to-pdf')}
            className={`py-1.5 rounded-md transition-all text-center font-sans text-xs font-bold cursor-pointer focus:outline-none ${
              mode === 'images-to-pdf'
                ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-50 border border-stone-200/50 dark:border-stone-700'
                : 'text-stone-550 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Photos to PDF
          </button>
          <button
            type="button"
            id="tab-pdf-to-formats"
            onClick={() => setMode('pdf-to-formats')}
            className={`py-1.5 rounded-md transition-all text-center font-sans text-xs font-bold cursor-pointer focus:outline-none ${
              mode === 'pdf-to-formats'
                ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-800 dark:text-stone-50 border border-stone-200/50 dark:border-stone-700'
                : 'text-stone-550 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            PDF to Formats
          </button>
        </div>
      </div>

      {/* Mode-specific Parameters */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="flex items-center space-x-2 text-stone-500 dark:text-stone-400">
          <Sliders className="h-4 w-4" strokeWidth={1.5} />
          <h4 className="font-sans text-xs font-bold uppercase tracking-wider">Customize Settings</h4>
        </div>

        {mode === 'images-to-pdf' ? (
          <div className="space-y-5">
            {/* Active Image Crop Parameters (Canva Sidebar Style) */}
            {activeCropFile && (
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/45 border border-stone-200/80 dark:border-stone-800/80 space-y-4">
                <div className="flex items-center space-x-2 text-stone-750 dark:text-stone-200">
                  <Crop className="h-4 w-4 text-stone-505" strokeWidth={2} />
                  <h5 className="font-sans text-xs font-bold uppercase tracking-wider">Crop & Edit Photo</h5>
                </div>
                
                <p className="font-mono text-[9px] text-stone-400 dark:text-stone-500 truncate leading-normal">
                  FILE: <span className="font-bold text-stone-700 dark:text-stone-300">{activeCropFile.name}</span>
                </p>

                <hr className="border-stone-150 dark:border-stone-800" />

                {/* Aspect Ratio Presets */}
                <div className="space-y-1.5">
                  <span className="block font-mono text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">
                    Force Page Shape
                  </span>
                  <div className="grid grid-cols-2 gap-1 px-0.5">
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
                        className={`px-2 py-1.5 text-[10.5px] rounded font-bold border cursor-pointer transition-colors focus:outline-none ${
                          cropAspectRatio === preset.id
                            ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950 shadow-sm'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mirror & Guides */}
                <div className="space-y-1.5">
                  <span className="block font-mono text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest">
                    Mirror & Guides
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCropFlipH(!cropFlipH)}
                      className={`flex-1 p-2 text-[10.5px] rounded border flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors ${
                        cropFlipH 
                          ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 dark:border-stone-100'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                      }`}
                      title="Flip Left-Right"
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" />
                      <span>Flip H</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCropFlipV(!cropFlipV)}
                      className={`flex-1 p-2 text-[10.5px] rounded border flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors ${
                        cropFlipV 
                          ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 dark:border-stone-100'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                      }`}
                      title="Flip Upside Down"
                    >
                      <FlipVertical className="h-3.5 w-3.5" />
                      <span>Flip V</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCropShowGrid(!cropShowGrid)}
                      className={`flex-1 p-2 text-[10.5px] rounded border flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors ${
                        cropShowGrid 
                          ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 dark:border-stone-100'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-600'
                      }`}
                      title="Toggle Editing Grid"
                    >
                      <Grid className="h-3.5 w-3.5" />
                      <span>Grid</span>
                    </button>
                  </div>
                </div>

                {/* Edit Action buttons */}
                <div className="flex gap-2 pt-1.5 border-t border-stone-150 dark:border-stone-805/40">
                  <button
                    type="button"
                    onClick={onCropReset}
                    className="flex-1 py-1.5 text-[11px] rounded border border-stone-200 dark:border-stone-800 bg-white hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400 font-bold flex items-center justify-center gap-1 cursor-pointer focus:outline-none transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset Full</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={onCropSave}
                    className="flex-1 py-1.5 text-[11px] rounded bg-emerald-600 hover:bg-emerald-505 dark:bg-emerald-700 dark:hover:bg-emerald-605 text-white font-bold flex items-center justify-center gap-1 border border-emerald-600 dark:border-emerald-700 cursor-pointer focus:outline-none transition-colors shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5 font-bold" strokeWidth={3} />
                    <span>Apply Crop</span>
                  </button>
                </div>

              </div>
            )}

            {/* Output File Name */}
            <div className="space-y-1.5">
              <label htmlFor="pdf-title-input" className="font-sans text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                Output File Name
              </label>
              <input
                id="pdf-title-input"
                type="text"
                value={pdfOptions.pdfTitle}
                onChange={(e) => updatePdfOption('pdfTitle', e.target.value)}
                placeholder="Enter a name for your PDF file"
                disabled={isConverting}
                className="w-full px-3 py-2 bg-transparent border border-stone-200 dark:border-stone-850 rounded font-sans text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500 dark:focus:border-stone-600 focus:ring-1 focus:ring-stone-500/20 disabled:opacity-50 editorial-transition"
              />
            </div>

            {/* Page Format */}
            <div className="space-y-1.5">
              <label className="font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                Page Size
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'a4', label: 'A4' },
                  { id: 'letter', label: 'Letter' },
                  { id: 'fit', label: 'Fit Photo' }
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`page-format-${item.id}`}
                    type="button"
                    onClick={() => !isConverting && updatePdfOption('pageFormat', item.id as any)}
                    className={`px-1 py-1.5 text-[10.5px] font-bold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                      pdfOptions.pageFormat === item.id
                        ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950 font-semibold shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-950 dark:border-stone-850 dark:text-stone-400 dark:hover:border-stone-600'
                    }`}
                    title={item.id === 'a4' ? 'A4 Size (210 × 297 mm)' : item.id === 'letter' ? 'US Letter (8.5 × 11 in)' : 'Page matches each original photo aspect ratio'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <label className="font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                Orientation
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'portrait', label: 'Portrait' },
                  { id: 'landscape', label: 'Landscape' },
                  { id: 'auto', label: 'Auto Fit' }
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`orientation-${item.id}`}
                    type="button"
                    onClick={() => !isConverting && updatePdfOption('orientation', item.id as any)}
                    className={`px-1 py-1.5 text-[10px] font-bold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                      pdfOptions.orientation === item.id
                        ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950 font-semibold shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-955 dark:border-stone-850 dark:text-stone-400 dark:hover:border-stone-600'
                    }`}
                    title={item.id === 'portrait' ? 'Vertical orientation (Tall pages)' : item.id === 'landscape' ? 'Horizontal orientation (Wide pages)' : 'Adapts direction to match each photo'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margins */}
            <div className="space-y-1.5">
              <label className="font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                White Border Margins
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 0, label: 'None' },
                  { id: 10, label: 'Thin' },
                  { id: 20, label: 'Standard' }
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`margin-${item.id}`}
                    type="button"
                    onClick={() => !isConverting && updatePdfOption('margin', item.id as any)}
                    className={`px-1 py-1.5 text-[10px] font-bold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                      pdfOptions.margin === item.id
                        ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950 font-semibold shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-955 dark:border-stone-850 dark:text-stone-400 dark:hover:border-stone-600'
                    }`}
                    title={item.id === 0 ? 'No white borders (Edge-to-edge)' : item.id === 10 ? 'Subtle 10mm margins' : 'Generous 20mm margins for notes or binding'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compression Quality */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans text-stone-650 dark:text-stone-405 font-bold text-[10px] uppercase tracking-wider">Sharpness & File Size</span>
                <span className="font-mono text-stone-800 dark:text-stone-200 font-heavy text-xs font-bold">{Math.round(pdfOptions.quality * 100)}%</span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={pdfOptions.quality}
                onChange={(e) => updatePdfOption('quality', parseFloat(e.target.value))}
                disabled={isConverting}
                className="w-full h-1 accent-stone-900 dark:accent-stone-100 cursor-pointer disabled:opacity-50"
              />
              <div className="flex justify-between text-[9px] text-stone-400 dark:text-stone-550 uppercase font-mono tracking-widest pt-0.5">
                <span>Smaller File</span>
                <span>Best Quality</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Target Conversion Format */}
            <div className="space-y-1.5">
              <label className="font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                Target Output Format
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'txt', label: 'Plain Text (.txt)' },
                  { id: 'md', label: 'Markdown (.md)' },
                  { id: 'png', label: 'PNG Pages (.zip)' },
                  { id: 'jpeg', label: 'JPEG Pages (.zip)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`target-format-${item.id}`}
                    type="button"
                    onClick={() => !isConverting && updateFormatOption('targetFormat', item.id as any)}
                    className={`px-2 py-2 text-[10.5px] font-bold rounded border cursor-pointer text-center focus:outline-none transition-colors leading-tight ${
                      formatOptions.targetFormat === item.id
                        ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950 font-semibold shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-955 dark:border-stone-850 dark:text-stone-400 dark:hover:border-stone-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Resolution */}
            {(formatOptions.targetFormat === 'png' || formatOptions.targetFormat === 'jpeg') && (
              <div className="space-y-1.5">
                <label className="font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                  Image Resolution DPI
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 1, label: '72 DPI' },
                    { id: 2, label: '150 DPI' },
                    { id: 3, label: '300 DPI' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      id={`resolution-scale-${item.id}`}
                      type="button"
                      onClick={() => !isConverting && updateFormatOption('resolutionScale', item.id as any)}
                      className={`w-full px-1.5 py-1.5 text-[10.5px] font-bold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                        formatOptions.resolutionScale === item.id
                          ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950'
                          : 'border-stone-200/70 hover:border-stone-450 dark:border-stone-850 bg-stone-50/15 text-stone-700 dark:text-stone-300'
                      }`}
                      title={item.id === 1 ? '72 DPI (Optimized and light)' : item.id === 2 ? '150 DPI (Balanced resolution)' : '300 DPI (Archival high resolution)'}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Page Range selector */}
            <div className="space-y-1.5">
              <label htmlFor="page-range-input" className="font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold block">
                Page Range Selector
              </label>
              <input
                id="page-range-input"
                type="text"
                value={formatOptions.pageRange}
                onChange={(e) => updateFormatOption('pageRange', e.target.value)}
                placeholder="Type 'all' or specific pages like '1, 3, 5-8'"
                disabled={isConverting}
                className="w-full px-3 py-2 bg-transparent border border-stone-200 dark:border-stone-850 rounded font-sans text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500 dark:focus:border-stone-600 focus:ring-1 focus:ring-stone-500/20 disabled:opacity-50 editorial-transition"
              />
              <p className="font-sans text-[9px] text-stone-400 dark:text-stone-550 italic">
                Type 'all' to save every page of your PDF document.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-stone-100 dark:border-stone-900"></div>

      {/* Main Conversion CTA button */}
      <div className="pt-2">
        <button
          id="convert-trigger-btn"
          onClick={onConvert}
          disabled={!hasFiles || isConverting}
          className={`relative w-full py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all focus:outline-none flex items-center justify-center space-x-2 shadow-sm ${
            !hasFiles
              ? 'bg-stone-100 text-stone-400 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-600 cursor-not-allowed'
              : isConverting
                ? 'bg-blue-500/10 border border-blue-400 text-blue-600 dark:bg-blue-500/5 dark:border-blue-900 dark:text-blue-400'
                : 'bg-stone-900 border border-stone-900 text-white hover:bg-stone-800 hover:border-stone-800 dark:bg-stone-100 dark:border-stone-100 dark:text-stone-950 dark:hover:bg-stone-200/90'
          }`}
        >
          {isConverting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full mr-2"
              />
              <span>Saving your document...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5" strokeWidth={2} />
              <span>
                {mode === 'images-to-pdf' ? 'Combine Photos into PDF ✓' : 'Extract Document Content ✓'}
              </span>
            </>
          )}
        </button>

        {!hasFiles && (
          <p className="text-center font-sans text-[10px] text-stone-400 dark:text-stone-500 mt-2 italic">
            Add at least one file to the queue on the left to start!
          </p>
        )}
      </div>

    </div>
  );
}
