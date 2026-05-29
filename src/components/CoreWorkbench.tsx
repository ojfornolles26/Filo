/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { FileUp, FileText, ArrowLeft, Layout, CheckCircle2 } from 'lucide-react';
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
  onExitWorkspace: () => void; // New prop for integrated navigation
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
  onRegisterActions,
  onExitWorkspace
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

  const activePdf = (activeCropFile && activeCropFile.type === 'application/pdf')
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
      <div className="flex-grow flex flex-col bg-white/70 dark:bg-stone-950/60 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/40 rounded-xl p-5 shadow-xs h-full min-h-[400px] justify-between relative overflow-hidden transition-all duration-300 hover:shadow-sm">
        
        {files.length === 0 ? (
          
          /* EMPTY STATE VIEWPORT */
          <div
            id="workbench-empty-dropzone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerBrowse}
            className={`w-full h-full min-h-[380px] border border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center p-8 text-center transition-all select-none ${
              isDragOver
                ? 'border-blue-500 bg-stone-100 dark:bg-stone-900/40'
                : 'border-stone-200/60 hover:border-stone-400 dark:border-stone-800/50 dark:hover:border-stone-700 bg-stone-50/10 dark:bg-stone-900/15'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center space-y-4 max-w-sm"
            >
              <div className="p-4 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-sm">
                <FileUp className="h-8 w-8 text-stone-700 dark:text-stone-300" strokeWidth={1.2} />
              </div>

              <div className="space-y-2">
                <p className="font-sans text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {mode === 'images-to-pdf' ? 'Create PDF from Images' : 'Extract PDF Content'}
                </p>
                <p className="font-sans text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Drag and drop files here, or <span className="underline text-blue-600 dark:text-blue-400 font-semibold">browse files</span>. Files are processed 100% locally.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block px-3 py-1 bg-stone-100 dark:bg-stone-900 rounded font-sans text-[10px] text-stone-500 dark:text-stone-400 font-semibold tracking-wide">
                  {acceptedTypesLabel}
                </span>
              </div>
            </motion.div>
          </div>

        ) : (

          /* ACTIVE CANVAS STATE */
          <div className="w-full h-full flex flex-col space-y-4 justify-between flex-1 min-h-0">
            
            {/* Integrated Header Row */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100/60 dark:border-stone-900/40 shrink-0">
              <div className="flex items-center space-x-3.5">
                <button
                  type="button"
                  onClick={onExitWorkspace}
                  className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 active:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 dark:active:bg-stone-800 border border-stone-200 dark:border-stone-800 rounded-lg font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 flex items-center space-x-1.5 cursor-pointer focus:outline-none transition-all shadow-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Exit Workspace</span>
                </button>

                <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />

                <div className="flex items-center space-x-1.5 select-none">
                  <div className="h-5 w-5 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-xs">
                    <FileText className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="font-brand italic text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-none">
                    Filo
                  </span>
                </div>
              </div>

              <div className="font-sans text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide truncate max-w-[300px] hidden sm:block">
                {mode === 'images-to-pdf' 
                  ? (activeCropFile ? activeCropFile.name : 'No Active Image')
                  : (activePdf ? activePdf.name : 'No Active PDF')
                }
              </div>
            </div>

            {/* Core Workspace Body */}
            <div className="flex-grow flex flex-col justify-center flex-1 min-h-0">
              {mode === 'images-to-pdf' ? (
                /* IMAGES-TO-PDF CROPPER */
                <div className="h-full flex flex-col justify-center">
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
                    <div className="h-72 border border-stone-200/50 dark:border-stone-800/40 bg-stone-50/20 rounded-xl flex items-center justify-center p-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                        <span className="font-sans text-xs text-stone-500">Retrieving active canvas...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PDF-TO-FORMATS EXTRACTION CONTAINER */
                <div className="space-y-6 py-2 flex flex-col h-full justify-center">
                  {/* Status Visualizer */}
                  <div className="border border-stone-200/50 dark:border-stone-900/40 bg-stone-50/15 dark:bg-stone-950/20 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-5">
                    <div className="relative w-24 h-32 bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800/40 rounded-xl shadow-xs flex flex-col p-2.5 justify-between">
                      <div className="space-y-2 flex flex-col items-stretch">
                        <div className="h-1 w-3/4 bg-stone-200 dark:bg-stone-800 rounded" />
                        <div className="h-1 w-full bg-stone-200 dark:bg-stone-800 rounded" />
                        <div className="h-1 w-5/6 bg-stone-200 dark:bg-stone-800 rounded" />
                        <div className="h-1 w-2/3 bg-stone-200 dark:bg-stone-800 rounded" />
                      </div>
                      <div className="border-t border-dashed border-stone-200 dark:border-stone-800 pt-2 flex justify-between items-center">
                        <div className="h-1 w-8 bg-blue-100 dark:bg-blue-900 rounded" />
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-sans text-sm font-semibold text-stone-800 dark:text-stone-300">
                        {activePdf ? activePdf.name : 'PDF Document'}
                      </h4>
                      <p className="font-sans text-xs text-stone-500 dark:text-stone-500 max-w-sm mx-auto leading-normal">
                        Ready for text & formatting extraction. Adjust target format and options in the right settings panel.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={triggerBrowse}
                      className="px-4 py-2 border border-stone-300 dark:border-stone-800 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 rounded-lg font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer focus:outline-none transition-colors"
                    >
                      Change PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
      
    </div>
  );
}
