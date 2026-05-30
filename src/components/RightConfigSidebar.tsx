/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ArrowRightLeft, FileDown, Sliders, ListPlus, Trash2, ArrowUp, ArrowDown, PlusCircle, FileText, Code, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ConversionMode,
  ImageToPdfOptions,
  PdfToFormatOptions,
  FiloFile
} from '../types';

interface RightConfigSidebarProps {
  mode: ConversionMode;
  setMode: (mode: ConversionMode) => void;
  pdfOptions: ImageToPdfOptions;
  setPdfOptions: (opts: ImageToPdfOptions) => void;
  formatOptions: PdfToFormatOptions;
  setFormatOptions: (opts: PdfToFormatOptions) => void;
  onConvert: () => void;
  isConverting: boolean;
  files: FiloFile[];
  onFilesAdded: (fileList: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  activeCropFile: FiloFile | null;
  setActiveCropFile: (file: FiloFile | null) => void;
}

export default function RightConfigSidebar({
  mode,
  setMode,
  pdfOptions,
  setPdfOptions,
  formatOptions,
  setFormatOptions,
  onConvert,
  isConverting,
  files,
  onFilesAdded,
  onRemoveFile,
  onMoveUp,
  onMoveDown,
  activeCropFile,
  setActiveCropFile
}: RightConfigSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updatePdfOption = <K extends keyof ImageToPdfOptions>(key: K, value: ImageToPdfOptions[K]) => {
    setPdfOptions({ ...pdfOptions, [key]: value });
  };

  const updateFormatOption = <K extends keyof PdfToFormatOptions>(key: K, value: PdfToFormatOptions[K]) => {
    setFormatOptions({ ...formatOptions, [key]: value });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImageMode = mode === 'images-to-pdf';

  return (
    <div className="flex flex-col h-full bg-white/70 dark:bg-stone-950/60 backdrop-blur-md p-6 border border-stone-200/50 dark:border-stone-800/40 rounded-xl justify-between space-y-4 shadow-xs transition-all duration-300 hover:shadow-sm overflow-hidden">
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={true}
        accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
        onChange={handleFileChange}
        className="hidden"
        id="right-sidebar-file-input"
      />

      {/* Header and settings */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        
        {/* Brand Header */}
        <div className="flex items-center space-x-2 border-b border-stone-100/60 dark:border-stone-800/40 pb-2.5">
          <Sliders className="h-4 w-4 text-stone-500" strokeWidth={1.5} />
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Workspace Settings
          </h2>
        </div>

        {/* Action Toggle Tab */}
        <div className="grid grid-cols-2 gap-1 bg-stone-100/70 p-1 rounded-lg dark:bg-stone-900/60 border border-stone-200/40 dark:border-stone-800/40 shrink-0 select-none">
          <button
            type="button"
            onClick={() => setMode('images-to-pdf')}
            className={`py-1 rounded-md transition-all text-center font-sans text-xs font-semibold cursor-pointer select-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none outline-hidden border ${
              isImageMode
                ? 'bg-white text-stone-900 shadow-xs border-stone-200/50 dark:bg-stone-800 dark:text-stone-50 dark:border-stone-700'
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Create PDF
          </button>
          <button
            type="button"
            onClick={() => setMode('pdf-to-formats')}
            className={`py-1 rounded-md transition-all text-center font-sans text-xs font-semibold cursor-pointer select-none focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none outline-hidden border ${
              !isImageMode
                ? 'bg-white text-stone-900 shadow-xs border-stone-200/50 dark:bg-stone-800 dark:text-stone-50 dark:border-stone-700'
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            Extract Content
          </button>
        </div>

        {/* Scrollable parameters & Queue section */}
        <div className="flex-1 custom-scrollbar pr-3 space-y-5">
          
          {/* Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-stone-500">
              <Sliders className="h-3.5 w-3.5" />
              <span className="font-sans text-[10px] uppercase font-semibold tracking-wider">Export Settings</span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {isImageMode ? (
                /* Image mode options */
                <motion.div
                  key="image-mode-options"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* PDF Output Name */}
                  <div className="space-y-1">
                    <label htmlFor="pdf-title-input" className="font-sans text-[10px] uppercase text-stone-500 dark:text-stone-500 font-semibold block">
                      File Name
                    </label>
                    <input
                      id="pdf-title-input"
                      type="text"
                      value={pdfOptions.pdfTitle}
                      onChange={(e) => updatePdfOption('pdfTitle', e.target.value)}
                      placeholder="Enter output name"
                      disabled={isConverting}
                      className="w-full px-3 py-1.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded font-sans text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 focus:ring-1 focus:ring-stone-500/20 disabled:opacity-50"
                    />
                  </div>

                  {/* Toggle Advanced options */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer border-t border-b border-stone-200/30 dark:border-stone-800/30 select-none pt-2 pb-2"
                  >
                    <span>Advanced PDF Options</span>
                    <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden space-y-4 pt-1"
                      >
                        {/* Page Format */}
                        <div className="space-y-1">
                          <label className="font-sans text-[10px] uppercase text-stone-500 dark:text-stone-500 font-semibold block">
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
                                type="button"
                                onClick={() => !isConverting && updatePdfOption('pageFormat', item.id as any)}
                                className={`py-1 text-[10px] font-semibold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                                  pdfOptions.pageFormat === item.id
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold shadow-xs'
                                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-700'
                                }`}
                                title={item.id === 'a4' ? 'A4 Size (210 × 297 mm)' : item.id === 'letter' ? 'US Letter (8.5 × 11 in)' : 'Page matches each original photo aspect ratio'}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Orientation */}
                        <div className="space-y-1">
                          <label className="font-sans text-[10px] uppercase text-stone-500 dark:text-stone-500 font-semibold block">
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
                                type="button"
                                onClick={() => !isConverting && updatePdfOption('orientation', item.id as any)}
                                className={`py-1 text-[10px] font-semibold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                                  pdfOptions.orientation === item.id
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold shadow-xs'
                                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-700'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* White Border Margins */}
                        <div className="space-y-1">
                          <label className="font-sans text-[10px] uppercase text-stone-500 dark:text-stone-500 font-semibold block">
                            Borders
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: 0, label: 'None' },
                              { id: 10, label: 'Thin' },
                              { id: 20, label: 'Standard' }
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => !isConverting && updatePdfOption('margin', item.id as any)}
                                className={`py-1 text-[10px] font-semibold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                                  pdfOptions.margin === item.id
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold shadow-xs'
                                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-700'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* PDF Compression Quality slider */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-sans text-stone-600 dark:text-stone-400 font-semibold text-[10px] uppercase tracking-wider">Image Quality</span>
                            <span className="font-mono text-stone-800 dark:text-stone-200 font-semibold text-xs">{Math.round(pdfOptions.quality * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.05"
                            value={pdfOptions.quality}
                            onChange={(e) => updatePdfOption('quality', parseFloat(e.target.value))}
                            disabled={isConverting}
                            className="w-full h-1 accent-stone-900 dark:accent-stone-100 cursor-pointer disabled:opacity-50"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                /* PDF mode options */
                <motion.div
                  key="pdf-mode-options"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Target Format */}
                  <div className="space-y-1">
                    <label className="font-sans text-[10px] uppercase text-stone-500 dark:text-stone-500 font-semibold block">
                      Output Format
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
                          type="button"
                          onClick={() => !isConverting && updateFormatOption('targetFormat', item.id as any)}
                          className={`py-1.5 text-[10px] font-semibold rounded border cursor-pointer text-center focus:outline-none transition-colors leading-tight ${
                            formatOptions.targetFormat === item.id
                              ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold shadow-xs'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Advanced options */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none cursor-pointer border-t border-b border-stone-200/30 dark:border-stone-800/30 select-none pt-2 pb-2"
                  >
                    <span>Advanced Options</span>
                    <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden space-y-4 pt-1"
                      >
                        {/* Resolution scale (only for image formats) */}
                        {(formatOptions.targetFormat === 'png' || formatOptions.targetFormat === 'jpeg') && (
                          <div className="space-y-1">
                            <label className="font-sans text-[10px] uppercase text-stone-400 dark:text-stone-500 font-semibold block">
                              Image Resolution
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: 1, label: '72 DPI (Standard)' },
                                { id: 2, label: '150 DPI (High)' },
                                { id: 3, label: '300 DPI (Print)' }
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => !isConverting && updateFormatOption('resolutionScale', item.id as any)}
                                  className={`w-full py-1 text-[9px] font-semibold rounded border cursor-pointer text-center focus:outline-none transition-colors truncate ${
                                    formatOptions.resolutionScale === item.id
                                      ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:border-blue-400 dark:text-blue-400 font-semibold shadow-xs'
                                      : 'border-stone-200/70 hover:border-stone-400 dark:border-stone-800 bg-stone-50/15 text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page Range */}
                        <div className="space-y-1">
                          <label htmlFor="page-range-input" className="font-sans text-[10px] uppercase text-stone-500 dark:text-stone-500 font-semibold block">
                            Page Range
                          </label>
                          <input
                            id="page-range-input"
                            type="text"
                            value={formatOptions.pageRange}
                            onChange={(e) => updateFormatOption('pageRange', e.target.value)}
                            placeholder="e.g. 'all' or '1, 3, 5-8'"
                            disabled={isConverting}
                            className="w-full px-3 py-1.5 bg-transparent border border-stone-200 dark:border-stone-800 rounded font-sans text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 focus:ring-1 focus:ring-stone-500/20 disabled:opacity-50"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <hr className="border-stone-100/60 dark:border-stone-800/40" />

          {/* Queue Section (Batch Processing) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-stone-500">
              <div className="flex items-center space-x-2">
                <ListPlus className="h-3.5 w-3.5" />
                <span className="font-sans text-[10px] uppercase font-semibold tracking-wider">Queue</span>
              </div>
              <span className="font-sans text-[10px] text-stone-400 font-medium">
                {files.length === 1 ? '1 file' : `${files.length} files`}
              </span>
            </div>

            {/* Dash Box to Add more Files */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={`flex flex-col items-center justify-center border border-dashed rounded-xl py-3 px-3 text-center transition-all cursor-pointer select-none ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/10 dark:border-blue-400'
                  : 'border-stone-200/60 dark:border-stone-800/40 bg-stone-500/5 hover:bg-stone-100 dark:hover:bg-stone-900/30'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-stone-700 dark:text-stone-300">
                <PlusCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="font-sans text-xs font-semibold">Add File</span>
              </div>
              <span className="font-sans text-[9px] text-stone-400 dark:text-stone-500 mt-0.5">
                Drag files or Click to browse
              </span>
            </div>

            {/* List of active queue items */}
            <div className="space-y-1.5 max-h-[220px] custom-scrollbar pr-2">
              <AnimatePresence initial={false}>
                {files.map((file, idx) => {
                  const isSelected = activeCropFile && activeCropFile.id === file.id;
                  const isImage = file.type.startsWith('image/');

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={() => setActiveCropFile(file)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 select-none ${
                        isSelected
                          ? isImage
                            ? 'border-blue-400/80 bg-blue-50/10 dark:bg-blue-950/10'
                            : 'border-emerald-400/80 bg-emerald-50/10 dark:bg-emerald-950/10'
                          : 'border-stone-200/50 dark:border-stone-800/30 bg-stone-50/10 hover:bg-stone-50/30 dark:bg-stone-950/20 dark:hover:bg-stone-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        
                        <div className="flex items-center space-x-2 truncate flex-1 min-w-0 mr-2">
                          {file.previewUrl && isImage ? (
                            <div className="h-6 w-6 rounded border border-stone-200 dark:border-stone-800 overflow-hidden flex-shrink-0">
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 flex items-center justify-center flex-shrink-0 text-[8px] font-bold">
                              PDF
                            </div>
                          )}

                          <div className="flex flex-col truncate">
                            <span className="font-sans text-[11px] font-semibold truncate leading-tight">
                              {file.name}
                            </span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-sans text-[9px] text-stone-400 dark:text-stone-500">
                                {formatSize(file.size)}
                              </span>
                              <span className="text-[9px] text-stone-200 dark:text-stone-800">|</span>
                              <span className={`font-sans text-[9px] uppercase font-semibold ${
                                file.status === 'completed' ? 'text-emerald-500' :
                                file.status === 'converting' ? 'text-blue-500 animate-pulse' :
                                file.status === 'failed' ? 'text-rose-500' : 'text-stone-500'
                              }`}>
                                {file.status === 'completed' ? 'ready' :
                                 file.status === 'converting' ? 'working' :
                                 file.status === 'failed' ? 'error' : 'idle'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(file.id);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Reorder actions */}
                      {isImage && files.filter(f => f.type.startsWith('image/')).length > 1 && (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100/40 dark:border-stone-800/20" onClick={(e) => e.stopPropagation()}>
                          <span className="font-sans text-[9px] text-stone-400">
                            Page {files.filter(f => f.type.startsWith('image/')).indexOf(file) + 1} of {files.filter(f => f.type.startsWith('image/')).length}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onMoveUp(idx)}
                              disabled={idx === 0}
                              className="p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveDown(idx)}
                              disabled={idx === files.length - 1}
                              className="p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-100/60 dark:border-stone-800/40 my-2"></div>

      {/* Action Button */}
      <div className="shrink-0 pt-1">
        <button
          onClick={onConvert}
          disabled={files.length === 0 || isConverting}
          className={`w-full py-2.5 px-4 font-sans text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer transition-all focus:outline-none flex items-center justify-center space-x-2 shadow-xs ${
            files.length === 0
              ? 'bg-stone-100 text-stone-400 border border-stone-200 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-600 cursor-not-allowed'
              : isConverting
                ? 'bg-blue-500/10 border border-blue-400 text-blue-600 dark:bg-blue-500/5 dark:border-blue-900 dark:text-blue-400'
                : 'bg-blue-600 border border-blue-700 hover:bg-blue-700 hover:border-blue-800 dark:bg-blue-500 dark:border-blue-600 dark:hover:bg-blue-400 dark:hover:border-blue-500 text-white transition-colors'
          }`}
        >
          {isConverting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full mr-2"
              />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>
                {isImageMode ? 'Create PDF' : 'Extract Content'}
              </span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
