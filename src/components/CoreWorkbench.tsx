/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { FileUp, FileText, CheckCircle2, ChevronRight, Play, Eye, Compass, Layout } from 'lucide-react';
import { FiloFile, ConversionMode } from '../types';
import InlineCropper from './InlineCropper';

interface CoreWorkbenchProps {
  files: FiloFile[];
  mode: ConversionMode;
  onFilesAdded: (fileList: FileList | File[]) => void;
  activeCropFile: FiloFile | null;
  onSaveCrop: (croppedFile: File, previewUrl: string, size: number) => void;
  triggerConversion: () => void;
  isConverting: boolean;
  aspectRatioType: 'free' | 'original' | '1:1' | '4:3';
  setAspectRatioType: (type: 'free' | 'original' | '1:1' | '4:3') => void;
  flipH: boolean;
  setFlipH: (val: boolean) => void;
  flipV: boolean;
  setFlipV: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  onRegisterActions: (actions: { reset: () => void; save: () => void } | null) => void;
}

export default function CoreWorkbench({
  files,
  mode,
  onFilesAdded,
  activeCropFile,
  onSaveCrop,
  triggerConversion,
  isConverting,
  aspectRatioType,
  setAspectRatioType,
  flipH,
  setFlipH,
  flipV,
  setFlipV,
  showGrid,
  setShowGrid,
  onRegisterActions
}: CoreWorkbenchProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const targetPdf = (activeCropFile && activeCropFile.type === 'application/pdf')
    ? activeCropFile
    : (files.find(f => f.type === 'application/pdf') || files[0]);

  const acceptedTypesLabel = 'PDF, PNG, JPG, JPEG, WEBP files';

  const acceptedInputTypes = 'image/png, image/jpeg, image/jpg, image/webp, application/pdf';

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Hidden Primary File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={true}
        accept={acceptedInputTypes}
        onChange={handleFilesChange}
        className="hidden"
        id="workbench-file-input"
      />

      {/* Main Sandbox Canvas Card */}
      <div className="flex-grow flex flex-col bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-6 shadow-sm h-full min-h-[400px] justify-center relative overflow-hidden">
        
        {files.length === 0 ? (
          
          /* ==========================================
             EMPTY CONTAINER DROPZONE VIEW
             ========================================== */
          <div
            id="workbench-empty-dropzone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerBrowse}
            className={`w-full h-full min-h-[400px] border border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center p-8 text-center transition-all select-none ${
              isDragOver
                ? 'border-blue-500 bg-stone-105 dark:bg-stone-900/40 dark:border-blue-450'
                : 'border-stone-200 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-700 bg-stone-50/20 dark:bg-stone-950/30'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center space-y-4 max-w-sm"
            >
              <div className="p-4 rounded-full border border-stone-150 dark:border-stone-850 bg-white dark:bg-stone-900/60 shadow-sm">
                <FileUp className="h-8 w-8 text-stone-700 dark:text-stone-300 animate-pulse" strokeWidth={1.2} />
              </div>

              <div className="space-y-2">
                <p className="font-serif italic text-base text-stone-800 dark:text-stone-200 font-medium">
                  {mode === 'images-to-pdf' ? 'Ready to combine your photographs?' : 'Drop your study PDF here'}
                </p>
                <p className="font-sans text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-normal">
                  Drag and drop {mode === 'images-to-pdf' ? 'your photos' : 'your document PDF'} here, or <span className="underline text-blue-650 dark:text-blue-400 font-bold">browse local files</span> to run high-quality client-side conversions.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-stone-100 dark:bg-stone-900 rounded font-mono text-[9px] text-stone-500 dark:text-stone-400 uppercase tracking-widest font-bold">
                  {acceptedTypesLabel} • MAX 25MB
                </span>
              </div>
            </motion.div>
          </div>

        ) : (

          /* ==========================================
             ACTIVE STATE VIEWPORT
             ========================================== */
          <div className="w-full h-full flex flex-col space-y-4 justify-between">
            
            {mode === 'images-to-pdf' ? (
              
              /* ==========================================
                 A. IMAGES-TO-PDF WORKBENCH: Inline Image Cropper
                 ========================================== */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400">
                      <Layout className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="font-mono text-[9.5px] uppercase font-heavy tracking-wider text-stone-500 dark:text-stone-400 font-extrabold">
                      Interactive Photo Editor Workspace
                    </span>
                  </div>
                  <span className="font-sans text-[10px] text-stone-455 dark:text-stone-500 italic block">
                    No popups! Dynamic visual boundaries saved in-place
                  </span>
                </div>

                {activeCropFile && activeCropFile.previewUrl ? (
                  <InlineCropper 
                    file={activeCropFile} 
                    onSave={onSaveCrop}
                    aspectRatioType={aspectRatioType}
                    setAspectRatioType={setAspectRatioType}
                    flipH={flipH}
                    setFlipH={setFlipH}
                    flipV={flipV}
                    setFlipV={setFlipV}
                    showGrid={showGrid}
                    setShowGrid={setShowGrid}
                    onRegisterActions={onRegisterActions}
                  />
                ) : (
                  <div className="h-72 border border-stone-200 dark:border-stone-800 bg-stone-50/20 rounded-lg flex items-center justify-center p-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-sans text-xs text-stone-500">Retrieving active canvas...</span>
                    </div>
                  </div>
                )}
              </div>

            ) : (

              /* ==========================================
                 B. PDF-TO-FORMATS EXTRACTION WORKBENCH
                 ========================================== */
              <div className="space-y-6 py-4">
                
                {/* Active file introduction box */}
                <div className="p-5 border border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-950/40 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5 truncate">
                    <div className="p-3.5 rounded bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex-shrink-0 border border-blue-100/30">
                      <FileText className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-extrabold">
                        Active PDF File Source
                      </span>
                      <span className="font-sans text-sm font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                        {targetPdf?.name || 'No Active PDF'}
                      </span>
                      <p className="font-mono text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                        Size: {targetPdf ? formatSize(targetPdf.size) : '0 B'} • Local Client Process
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={triggerBrowse}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-800 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 rounded font-sans text-xs font-bold text-stone-750 dark:text-stone-300 cursor-pointer focus:outline-none transition-colors"
                  >
                    Load Different PDF
                  </button>
                </div>

                {/* Dashboard graphic highlighting the active process */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Info card 1 */}
                  <div className="border border-stone-200/60 dark:border-stone-800/60 p-4 rounded-lg space-y-2 bg-stone-50/10 dark:bg-stone-950/20">
                    <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest font-extrabold block">
                      Target Formats
                    </span>
                    <h5 className="font-sans text-xs font-bold text-stone-800 dark:text-stone-200 font-bold">
                      Smart Text & Image Extraction
                    </h5>
                    <p className="font-serif italic text-xs leading-relaxed text-stone-550 dark:text-stone-400">
                      Choose plain text, markdown formatted notes, or pull individual page imagery as a zipped bundle on the right panel.
                    </p>
                  </div>

                  {/* Info card 2 */}
                  <div className="border border-stone-200/60 dark:border-stone-800/60 p-4 rounded-lg space-y-2 bg-stone-50/10 dark:bg-stone-950/20">
                    <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest font-extrabold block">
                      Study Optimization
                    </span>
                    <h5 className="font-sans text-xs font-bold text-stone-800 dark:text-stone-200 font-bold">
                      Perfect for Class Lectures
                    </h5>
                    <p className="font-serif italic text-xs leading-relaxed text-stone-550 dark:text-stone-400">
                      Markdown extracts titles, chapters and list structures efficiently. Image formats output crisp vector page rendering.
                    </p>
                  </div>

                </div>

                {/* Workspace Visualizer Blueprint (Decorative visual detailing paper page) */}
                <div className="border border-stone-205 dark:border-stone-900 bg-stone-50/20 dark:bg-stone-950/45 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-28 h-36 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded shadow-md flex flex-col p-2.5 justify-between">
                    <div className="space-y-1.5 flex flex-col items-stretch">
                      <div className="h-1 w-3/4 bg-stone-200 dark:bg-stone-800 rounded" />
                      <div className="h-1.5 w-full bg-stone-105 dark:bg-stone-800 rounded" />
                      <div className="h-1 w-5/6 bg-stone-105 dark:bg-stone-800 rounded" />
                      <div className="h-1 w-2/3 bg-stone-105 dark:bg-stone-800 rounded" />
                    </div>
                    <div className="border-t border-dashed border-stone-200 dark:border-stone-800 pt-1.5 flex justify-between items-center">
                      <div className="h-1 w-6 bg-blue-100 dark:bg-blue-900 rounded" />
                      <div className="h-1 w-3 bg-stone-200 dark:bg-stone-700 rounded" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-sans text-xs font-bold text-stone-800 dark:text-stone-300">
                      Document extraction layer stands primed.
                    </h4>
                    <p className="font-serif italic text-[11px] text-stone-450 dark:text-stone-500 mt-1">
                      Choose settings on the right panel and press "Extract" to generate files instantly.
                    </p>
                  </div>
                </div>

              </div>

            )}

          </div>

        )}

      </div>
      
    </div>
  );
}
