/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListPlus, Trash2, ArrowUp, ArrowDown, FileText, PlusCircle, CheckCircle } from 'lucide-react';
import { FiloFile, ConversionMode } from '../types';

interface FileQueueSidebarProps {
  files: FiloFile[];
  mode: ConversionMode;
  onFilesAdded: (fileList: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  activeCropFile: FiloFile | null;
  setActiveCropFile: (file: FiloFile | null) => void;
}

export default function FileQueueSidebar({
  files,
  mode,
  onFilesAdded,
  onRemoveFile,
  onMoveUp,
  onMoveDown,
  activeCropFile,
  setActiveCropFile
}: FileQueueSidebarProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const acceptedTypes = 'image/png, image/jpeg, image/jpg, image/webp, application/pdf';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-950 p-5 border border-stone-200 dark:border-stone-800 rounded-lg space-y-4 shadow-sm">
      
      {/* Hidden file input specifically for adding additional files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={true}
        accept={acceptedTypes}
        onChange={handleChange}
        className="hidden"
        id="sidebar-file-input"
      />

      {/* Sidebar Header */}
      <div>
        <div className="flex items-center space-x-2">
          <ListPlus className="h-4 w-4 text-stone-500" strokeWidth={1.5} />
          <h3 className="font-sans text-xs uppercase tracking-wider font-extrabold text-stone-500 dark:text-stone-400">
            Document Queue
          </h3>
        </div>
        <p className="font-mono text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-0.5">
          {files.length === 1 ? '1 FILE LOADED' : `${files.length} FILES LOADED`}
        </p>
      </div>

      <hr className="border-stone-100 dark:border-stone-900" />

      {/* Top Banner / Uploader Zone */}
      <div className="space-y-1">
        <div
          id="sidebar-add-more-area"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`flex flex-col items-center justify-center border border-dashed rounded-lg py-3 px-3 text-center transition-all cursor-pointer select-none ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/10 dark:border-blue-500/10 dark:border-blue-400 font-semibold'
              : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 hover:bg-stone-100 dark:hover:bg-stone-905/60'
          }`}
          title="Add files (images or PDFs)"
        >
          <div className="flex items-center space-x-1.5 text-stone-750 dark:text-stone-200">
            <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
            <span className="font-sans text-xs font-bold leading-none">Add Image or PDF</span>
          </div>
          <span className="font-mono text-[8.5px] uppercase tracking-wider text-stone-400 dark:text-stone-500 mt-0.5 whitespace-nowrap">
            Drag here or Click to browse
          </span>
        </div>
      </div>

      <hr className="border-stone-100 dark:border-stone-900" />

      {/* List container with scroll support */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50/20 dark:bg-stone-950/25">
            <span className="font-serif italic text-xs text-stone-400 dark:text-stone-600 block">
              Queue is empty.
            </span>
            <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 block mt-1 leading-relaxed">
              Drop some files here or in the workbench to get started.
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {files.map((file, idx) => {
              const isSelected = activeCropFile && activeCropFile.id === file.id;
              const isImage = file.type.startsWith('image/');

              return (
                <motion.div
                  key={file.id}
                  id={`sidebar-queue-item-${file.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => {
                    setActiveCropFile(file);
                  }}
                  className={`p-2.5 rounded border transition-all select-none cursor-pointer flex flex-col space-y-2 ${
                    isSelected
                      ? isImage
                        ? 'border-blue-400 bg-blue-50/10 dark:bg-blue-950/10 border-l-4 border-l-blue-600'
                        : 'border-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/10 border-l-4 border-l-emerald-600'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/20 hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900/40 text-stone-900 dark:text-stone-100'
                  }`}
                  title={isImage ? "Click to view and crop this image" : "Click to view and extract this PDF"}
                >
                  <div className="flex items-center justify-between">
                    
                    {/* Thumbnail + info */}
                    <div className="flex items-center space-x-2.5 truncate min-w-0 flex-1 mr-2">
                      {file.previewUrl && isImage ? (
                        <div className="h-8 w-8 rounded-md border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-100 flex-shrink-0">
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-450 dark:text-stone-500 flex items-center justify-center flex-shrink-0 font-bold">
                          PDF
                        </div>
                      )}

                      <div className="flex flex-col truncate">
                        <span className="font-sans text-xs font-bold truncate">
                          {file.name}
                        </span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="font-mono text-[9px] text-stone-400 dark:text-stone-500">
                            {formatSize(file.size)}
                          </span>
                          <span className="text-[9px] text-stone-200 dark:text-stone-800">|</span>
                          <span className={`font-mono text-[9px] uppercase font-bold tracking-wider ${
                            file.status === 'completed' ? 'text-emerald-500' :
                            file.status === 'converting' ? 'text-blue-500 animate-pulse' :
                            file.status === 'failed' ? 'text-rose-500' : 'text-stone-400'
                          }`}>
                            {file.status === 'completed' ? 'ready' :
                             file.status === 'converting' ? 'working' :
                             file.status === 'failed' ? 'error' : 'idle'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(file.id);
                      }}
                      className="p-1 rounded text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                  </div>

                  {/* Ordering controllers for images combining */}
                  {isImage && files.filter(f => f.type.startsWith('image/')).length > 1 && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-900/50">
                      <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                        Page {files.filter(f => f.type.startsWith('image/')).indexOf(file) + 1} of {files.filter(f => f.type.startsWith('image/')).length}
                      </span>
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed hover:bg-stone-200/50 dark:hover:bg-stone-850/55 transition-colors"
                          title="Move Page Earlier"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveDown(idx)}
                          disabled={idx === files.length - 1}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed hover:bg-stone-200/50 dark:hover:bg-stone-850/55 transition-colors"
                          title="Move Page Later"
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
        )}
      </div>

    </div>
  );
}
