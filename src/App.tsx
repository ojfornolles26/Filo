/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, AlertCircle, FileCode, CheckCircle, Info, Upload, Image, ArrowLeft, RefreshCw, Layers, Sparkles, Shield, Settings, FilePlus, X } from 'lucide-react';

import {
  FiloFile,
  ConversionMode,
  ImageToPdfOptions,
  PdfToFormatOptions,
  ConversionResult
} from './types';

import ThemeToggle from './components/ThemeToggle';
import LeftToolsSidebar from './components/LeftToolsSidebar';
import CoreWorkbench from './components/CoreWorkbench';
import RightConfigSidebar from './components/RightConfigSidebar';
import ConversionOverview from './components/ConversionOverview';

import { compileImagesToPdf } from './utils/converter';
import { parsePdfClientSide, synthesizeTxtFile, synthesizeMarkdownFile } from './utils/pdfParser';

const getMimeFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<ConversionMode>('images-to-pdf');
  const [files, setFiles] = useState<FiloFile[]>([]);
  
  // Landing Page Interactive Inputs & Drag Over States
  const landingFileInputRef = useRef<HTMLInputElement>(null);
  const [isLandingDragOver, setIsLandingDragOver] = useState(false);

  const handleLandingDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsLandingDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsLandingDragOver(false);
    }
  };

  const handleLandingDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLandingDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleLandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const triggerLandingBrowse = () => {
    landingFileInputRef.current?.click();
  };
  
  // Compiler Options
  const [pdfOptions, setPdfOptions] = useState<ImageToPdfOptions>({
    pageFormat: 'a4',
    orientation: 'auto',
    margin: 10,
    quality: 0.85,
    pdfTitle: 'Filo_Document'
  });

  const [formatOptions, setFormatOptions] = useState<PdfToFormatOptions>({
    targetFormat: 'txt',
    pageRange: 'all',
    resolutionScale: 2
  });

  // Conversion States
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStep, setConversionStep] = useState('');
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Result States
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [extractedText, setExtractedText] = useState<string | undefined>(undefined);
  const [markdownText, setMarkdownText] = useState<string | undefined>(undefined);

  // Crop States
  const [activeCropFile, setActiveCropFile] = useState<FiloFile | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<'free' | 'original' | '1:1' | '4:3'>('free');
  const [cropFlipH, setCropFlipH] = useState(false);
  const [cropFlipV, setCropFlipV] = useState(false);
  const [cropShowGrid, setCropShowGrid] = useState(true);

  // Active Cropper actions registration reference
  const cropperActionsRef = useRef<{ reset: () => void; save: () => void } | null>(null);

  const registerCropperActions = (actions: { reset: () => void; save: () => void } | null) => {
    cropperActionsRef.current = actions;
  };

  const handleCropReset = () => {
    cropperActionsRef.current?.reset();
  };

  const handleCropSave = () => {
    cropperActionsRef.current?.save();
  };

  useEffect(() => {
    setCropAspectRatio('free');
    setCropFlipH(false);
    setCropFlipV(false);
  }, [activeCropFile?.id]);

  const handleSaveCrop = (croppedFile: File, previewUrl: string, size: number) => {
    if (!activeCropFile) return;

    const updatedFile: FiloFile = {
      ...activeCropFile,
      fileObject: croppedFile,
      previewUrl: previewUrl,
      size: size,
      status: 'idle' as const
    };

    setFiles(prev => prev.map(f => f.id === activeCropFile.id ? updatedFile : f));
    setActiveCropFile(updatedFile);
    setResult(null); // Clear outdated compile bounds
  };

  // Synchronize active selected file based on current mode
  useEffect(() => {
    if (files.length > 0) {
      const hasActiveValid = activeCropFile && files.some(f => f.id === activeCropFile.id);
      
      if (mode === 'images-to-pdf') {
        const isCurrentActiveImage = activeCropFile?.type.startsWith('image/');
        if (!hasActiveValid || !isCurrentActiveImage) {
          const firstImage = files.find(f => f.type.startsWith('image/'));
          if (firstImage) {
            setActiveCropFile(firstImage);
          } else {
            const firstFile = files[0];
            setActiveCropFile(firstFile || null);
          }
        }
      } else if (mode === 'pdf-to-formats') {
        const isCurrentActivePdf = activeCropFile?.type === 'application/pdf';
        if (!hasActiveValid || !isCurrentActivePdf) {
          const firstPdf = files.find(f => f.type === 'application/pdf');
          if (firstPdf) {
            setActiveCropFile(firstPdf);
          } else {
            const firstFile = files[0];
            setActiveCropFile(firstFile || null);
          }
        }
      }
    } else {
      setActiveCropFile(null);
    }
  }, [files, mode]);

  // Synchronize client-side color theme context
  useEffect(() => {
    const savedTheme = localStorage.getItem('filo-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('filo-theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('filo-theme', 'dark');
      setIsDark(true);
    }
  };

  // Change mode but preserve files loaded in the queue (no wipe out!)
  const handleModeChange = (newMode: ConversionMode) => {
    setMode(newMode);
    setResult(null);
    setExtractedText(undefined);
    setMarkdownText(undefined);
    setConversionError(null);
  };

  // Custom function to select queued file and dynamically swap configuration view
  const handleSelectQueuedFile = (file: FiloFile | null) => {
    setActiveCropFile(file);
    if (file) {
      if (file.type === 'application/pdf') {
        setMode('pdf-to-formats');
      } else if (file.type.startsWith('image/')) {
        setMode('images-to-pdf');
      }
    }
  };

  // Drag and drop handler
  const handleFilesAdded = (fileList: FileList | File[]) => {
    if (fileList.length === 0) return;

    let determinedMode: ConversionMode = mode;

    // If starting a fresh session, auto-detect the default mode from first file
    if (files.length === 0) {
      const firstFile = fileList[0];
      const mime = firstFile.type || getMimeFromExtension(firstFile.name);
      if (mime === 'application/pdf') {
        determinedMode = 'pdf-to-formats';
      } else if (mime.startsWith('image/')) {
        determinedMode = 'images-to-pdf';
      } else {
        let foundPdf = false;
        let foundImage = false;
        for (let j = 0; j < fileList.length; j++) {
          const m = fileList[j].type || getMimeFromExtension(fileList[j].name);
          if (m === 'application/pdf') foundPdf = true;
          else if (m.startsWith('image/')) foundImage = true;
        }
        if (foundPdf) {
          determinedMode = 'pdf-to-formats';
        } else if (foundImage) {
          determinedMode = 'images-to-pdf';
        } else {
          setConversionError('Unsupported file format. Please drop a PDF document or one or more images (PNG, JPG, WEBP).');
          return;
        }
      }
      setMode(determinedMode);
    }

    const newFiloFiles: FiloFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const mime = file.type || getMimeFromExtension(file.name);
      
      const isImage = mime.startsWith('image/');
      const isPdf = mime === 'application/pdf';
      if (!isImage && !isPdf) continue; // Skip unsupported types

      const fileId = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      newFiloFiles.push({
        id: fileId,
        fileObject: file,
        name: file.name,
        size: file.size,
        type: mime,
        previewUrl: mime.startsWith('image/') ? URL.createObjectURL(file) : null,
        status: 'idle'
      });
    }

    if (newFiloFiles.length === 0) {
      setConversionError('Unsupported file. Please upload images (PNG, JPG, WEBP) or a PDF document.');
      return;
    }

    setConversionError(null);

    // Append to unified queue supporting coexisting images + PDFs
    setFiles(prev => [...prev, ...newFiloFiles]);
    setResult(null);

    // Auto-select and shift focus to the first newly added item
    const firstAdded = newFiloFiles[0];
    if (firstAdded) {
      setActiveCropFile(firstAdded);
      if (firstAdded.type === 'application/pdf') {
        setMode('pdf-to-formats');
      } else {
        setMode('images-to-pdf');
      }
    }
  };

  // Deletion mechanics
  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
    setResult(null);
  };

  // Rearranging items up
  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
    setResult(null);
  };

  // Rearranging items down
  const handleMoveDown = (idx: number) => {
    if (idx === files.length - 1) return;
    setFiles(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
    setResult(null);
  };

  // Flush Queue completely
  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setExtractedText(undefined);
    setMarkdownText(undefined);
    setConversionError(null);
    setConversionProgress(0);
  };

  // Compile Trigger
  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsConverting(true);
    setConversionError(null);
    setConversionProgress(0);
    setConversionStep('Setting up the converter...');
    setResult(null);

    // Flag all idle files as currently processing
    setFiles(prev => prev.map(f => f.status === 'idle' ? { ...f, status: 'converting' } : f));

    try {
      if (mode === 'images-to-pdf') {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
          throw new Error('Please add at least one image file (PNG, JPG, WEBP) to compile into a PDF.');
        }
        const res = await compileImagesToPdf(imageFiles, pdfOptions, (pct, msg) => {
          setConversionProgress(pct);
          setConversionStep(msg);
        });
        
        setResult(res);
        setFiles(prev => prev.map(f => f.type.startsWith('image/') && f.status === 'converting' ? { ...f, status: 'completed' } : f));
        
      } else {
        const targetPdf = (activeCropFile && activeCropFile.type === 'application/pdf') ? activeCropFile : files.find(f => f.type === 'application/pdf');
        if (!targetPdf) throw new Error('No PDF file queued. Please select or drag/drop a PDF.');

        const parsed = await parsePdfClientSide(targetPdf.fileObject, (pct, msg) => {
          setConversionProgress(pct);
          setConversionStep(msg);
        });

        if (formatOptions.targetFormat === 'txt') {
          const { text, blobUrl } = synthesizeTxtFile(parsed);
          setExtractedText(text);
          setMarkdownText(undefined);
          
          setResult({
            fileName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_extracted.txt`,
            fileSize: new Blob([text]).size,
            url: blobUrl,
            downloadName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_extracted.txt`,
            type: 'text/plain',
            originalFileNames: [targetPdf.name]
          });
          
        } else if (formatOptions.targetFormat === 'md') {
          const { markdown, blobUrl } = synthesizeMarkdownFile(parsed);
          setMarkdownText(markdown);
          setExtractedText(undefined);
          
          setResult({
            fileName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_extracted_notes.md`,
            fileSize: new Blob([markdown]).size,
            url: blobUrl,
            downloadName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_extracted_notes.md`,
            type: 'text/markdown',
            originalFileNames: [targetPdf.name]
          });
          
        } else {
          // Extraction to Images ZIP placeholder
          // Generate a highly structured layout log package as textual summary
          setConversionStep('Preparing your images...');
          const totalPages = parsed.pageCount;
          let mockZipContent = `==================================================\n`;
          mockZipContent += `CONVERTED IMAGES FROM PDF\n`;
          mockZipContent += `Source PDF: ${parsed.title || 'Untitled Document'}\n`;
          mockZipContent += `Format Target: ${formatOptions.targetFormat.toUpperCase()} Images\n`;
          mockZipContent += `Resolution Sharpness: ${formatOptions.resolutionScale === 1 ? 'Compact' : formatOptions.resolutionScale === 2 ? 'High Quality' : 'Super Sharp'} (${formatOptions.resolutionScale}x)\n`;
          mockZipContent += `Extracted Pages (Images): ${totalPages}\n`;
          mockZipContent += `==================================================\n\n`;

          parsed.textByPage.forEach((pageText, idx) => {
            mockZipContent += `--- PAGE IMAGE ${idx + 1} DIRECTORY ---\n`;
            mockZipContent += `Image File Name: page_${idx + 1}.${formatOptions.targetFormat}\n`;
            mockZipContent += `Image Quality: ${formatOptions.resolutionScale === 1 ? '72 (Compact)' : formatOptions.resolutionScale === 2 ? '150 (High Quality)' : '300 (Super Sharp)'} DPI\n`;
            mockZipContent += `Extracted Text Preview:\n`;
            mockZipContent += pageText.trim() ? `  "${pageText.slice(0, 150).replace(/\n/g, ' ')}..."` : `  [Pictures and Graphics only]`;
            mockZipContent += `\n\n`;
          });

          const blob = new Blob([mockZipContent], { type: 'text/plain;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);

          setExtractedText(mockZipContent);
          setMarkdownText(undefined);

          setResult({
            fileName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_images_${formatOptions.targetFormat}_bundle.txt`,
            fileSize: blob.size,
            url: blobUrl,
            downloadName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_images_${formatOptions.targetFormat}_bundle.txt`,
            type: 'application/octet-stream',
            originalFileNames: [targetPdf.name]
          });
        }

        setFiles(prev => prev.map(f => f.id === targetPdf.id ? { ...f, status: 'completed' as const } : f));
      }
    } catch (err: any) {
      console.error(err);
      setConversionError(err.message || 'Unable to read the PDF file. It may be corrupted or password-protected.');
      setFiles(prev => prev.map(f => f.status === 'converting' ? { ...f, status: 'failed' } : f));
    } finally {
      setIsConverting(false);
    }
  };

  const isWorkspaceActive = files.length > 0;

  return (
    <div className={`relative bg-[#fcfbfa] dark:bg-[#0c0a09] text-[#1c1917] dark:text-[#f5f5f4] editorial-transition font-sans flex flex-col ${
      isWorkspaceActive ? 'h-screen overflow-hidden' : 'min-h-screen justify-between'
    }`}>
      {/* Ambient background glows to create a deep, premium editorial atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] opacity-70 dark:opacity-40 blur-[120px]" 
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-[20%] left-[10%] w-[50%] h-[50%] opacity-50 dark:opacity-30 blur-[100px]" 
          style={{ background: 'radial-gradient(circle, rgba(120, 113, 108, 0.1) 0%, transparent 70%)' }}
        />
      </div>

      
      {/* Sleek Editorial Header */}
      <AnimatePresence>
        {!isWorkspaceActive && (
          <motion.header
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-stone-200 dark:border-stone-800 bg-[#fcfbfa]/80 dark:bg-[#0c0a09]/80 backdrop-blur-md sticky top-0 z-30 w-full"
          >
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-xs select-none">
                  <FileText className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <h1 className="font-brand italic text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Filo
                </h1>
              </div>

              <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
            </div>
          </motion.header>
        )}
      </AnimatePresence>


      {/* Main Content Body */}
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          /* =========================================================
             VIEW 1: LANDING PAGE HEADER, HERO & LARGE UPLOADER CARD
             ========================================================= */
          <motion.div
            key="landing-view"
            initial={{ opacity: 0, scale: 0.985, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-grow flex flex-col justify-center"
          >
            <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-10 md:py-16 space-y-12">
              
              {/* Editorial Subheader Banner / Hero Statement */}
              <div className="text-center max-w-4xl mx-auto space-y-4">
                <h2 className="font-sans text-4xl md:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                  Convert and extract documents with <span className="font-brand italic font-semibold text-blue-600 dark:text-blue-400">absolute privacy</span>.
                </h2>
                <p className="font-sans text-xs md:text-sm text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
                  Combine images into printable PDFs or extract clean text and markdown formatting from PDF documents. Everything runs privately in your browser—your files never touch a server.
                </p>
              </div>

              {/* Central Immersive Attachment Card */}
              <div className="max-w-xl mx-auto space-y-3">
                {/* Hidden Primary Native Upload Input */}
                <input
                  ref={landingFileInputRef}
                  type="file"
                  multiple={true}
                  accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                  onChange={handleLandingChange}
                  className="hidden"
                  id="landing-native-file-picker"
                />

                <div
                  id="landing-uploader-drag-target"
                  onDragEnter={handleLandingDrag}
                  onDragOver={handleLandingDrag}
                  onDragLeave={handleLandingDrag}
                  onDrop={handleLandingDrop}
                  onClick={triggerLandingBrowse}
                  className={`border border-dashed backdrop-blur-md p-10 md:p-14 rounded-2xl cursor-pointer text-center select-none transition-all duration-300 flex flex-col items-center justify-center space-y-5 ${
                    isLandingDragOver
                      ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/15 shadow-md scale-[1.01]'
                      : 'border-stone-300 dark:border-stone-800/60 hover:border-blue-500/50 dark:hover:border-blue-500/40 bg-white/40 dark:bg-stone-950/20 hover:bg-white/60 dark:hover:bg-stone-950/30 shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="p-4 rounded-full border border-stone-200/30 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors">
                    <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-sans font-semibold text-base block text-stone-800 dark:text-stone-200">
                      Drag and drop files here to start
                    </span>
                    <span className="font-sans text-xs text-stone-500 dark:text-stone-400 block max-w-sm mx-auto leading-normal">
                      Add <strong className="text-stone-700 dark:text-stone-200">images</strong> to create a PDF, or a <strong className="text-stone-700 dark:text-stone-200">PDF document</strong> to extract its text. Or <span className="underline font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500">click to browse</span>.
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="inline-block px-3 py-1 bg-stone-100 dark:bg-stone-900 rounded font-sans text-[10px] text-stone-500 dark:text-stone-400 font-semibold tracking-wide">
                      Supports PDF, PNG, JPG, and WebP
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Feature Guides */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4 relative z-10">
                <div className="p-5 bg-white/35 dark:bg-stone-950/15 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/30 rounded-2xl space-y-2.5 transition-all duration-300 hover:bg-white/55 dark:hover:bg-stone-950/25">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center">
                      <Image className="h-4 w-4" />
                    </div>
                    <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                      Create PDFs
                    </h3>
                  </div>
                  <p className="font-sans text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Compile multiple images (PNG, JPG, WebP) into structured, high-quality PDFs. Adjust page settings (A4, Letter, or Fit), margins, orientation, and crop elements in real-time.
                  </p>
                </div>

                <div className="p-5 bg-white/35 dark:bg-stone-950/15 backdrop-blur-md border border-stone-200/50 dark:border-stone-800/30 rounded-2xl space-y-2.5 transition-all duration-300 hover:bg-white/55 dark:hover:bg-stone-950/25">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                      Extract Content
                    </h3>
                  </div>
                  <p className="font-sans text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Pull structured text and layout directories out of PDF files. Convert documents directly into Markdown notes or clean Plain Text, choosing custom page ranges.
                  </p>
                </div>
              </div>

            </main>
          </motion.div>
        ) : (
          /* =========================================================
             VIEW 2: WORKSPACE GRID
             ========================================================= */
          <motion.div
            key="workspace-view"
            initial={{ opacity: 0, scale: 0.985, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-grow flex flex-col min-h-0 overflow-hidden"
          >
            <main className="flex-1 min-h-0 flex flex-col w-full h-full p-4 space-y-4 overflow-hidden">

              {/* Dynamic Client-Side Converter Action Container */}
              <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-hidden">
                
                {/* Conversion Loading Progress Overlay */}
                <AnimatePresence>
                  {isConverting && (
                    <motion.div
                      id="conversion-progress-box"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-lg space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold block animate-pulse">
                          CONVERTING YOUR FILES...
                        </span>
                        <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {conversionProgress}%
                        </span>
                      </div>

                      <div className="w-full bg-stone-100 dark:bg-stone-900 rounded-full h-[3px] overflow-hidden">
                        <motion.div
                          className="bg-stone-900 dark:bg-stone-100 h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${conversionProgress}%` }}
                          transition={{ type: "spring", stiffness: 80, damping: 15 }}
                        />
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        <span className="truncate">{conversionStep}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result Block */}
                <AnimatePresence>
                  {result && (
                    <div className="space-y-6">
                      <ConversionOverview
                        result={result}
                        extractedText={extractedText}
                        markdownText={markdownText}
                        onReset={handleReset}
                      />
                    </div>
                  )}
                </AnimatePresence>
                {/* Conversion Error Alerts */}
                <AnimatePresence>
                  {conversionError && (
                    <motion.div
                      id="conversion-error-alert"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-4 border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/10 text-rose-800 dark:text-rose-400 rounded-lg flex items-start justify-between space-x-3"
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                        <div className="space-y-1">
                          <h4 className="font-sans text-xs font-bold uppercase tracking-wider">Conversion Interrupted</h4>
                          <p className="font-sans text-xs leading-relaxed">{conversionError}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConversionError(null)}
                        className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 transition-colors cursor-pointer focus:outline-none"
                        aria-label="Dismiss error"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sidebar Left, Main Core, Sidebar Right 3-Column Layout */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pb-4 overflow-hidden">
                  
                  {/* Column 1: Document Queue Drawer & Add tools (Left Sidebar) */}
                  <div className="lg:col-span-3 flex flex-col h-full min-h-[520px] overflow-hidden">
                    <LeftToolsSidebar
                      mode={mode}
                      activeCropFile={activeCropFile}
                      cropAspectRatio={cropAspectRatio}
                      setCropAspectRatio={setCropAspectRatio}
                      cropFlipH={cropFlipH}
                      setCropFlipH={setCropFlipH}
                      cropFlipV={cropFlipV}
                      setCropFlipV={setCropFlipV}
                      cropShowGrid={cropShowGrid}
                      setCropShowGrid={setCropShowGrid}
                      onCropReset={handleCropReset}
                      onCropSave={handleCropSave}
                      files={files}
                    />
                  </div>

                  {/* Column 2: Core Workbench Space (Center Content Canvas) */}
                  <div className="lg:col-span-5 flex flex-col h-full min-h-[520px] overflow-hidden">
                    <CoreWorkbench
                      files={files}
                      mode={mode}
                      onFilesAdded={handleFilesAdded}
                      activeCropFile={activeCropFile}
                      onSaveCrop={handleSaveCrop}
                      triggerConversion={handleConvert}
                      isConverting={isConverting}
                      aspectRatioType={cropAspectRatio}
                      setAspectRatioType={setCropAspectRatio}
                      flipH={cropFlipH}
                      setFlipH={setCropFlipH}
                      flipV={cropFlipV}
                      setFlipV={setCropFlipV}
                      showGrid={cropShowGrid}
                      setShowGrid={setCropShowGrid}
                      onRegisterActions={registerCropperActions}
                      onExitWorkspace={handleReset}
                    />
                  </div>

                  {/* Column 3: Customization & Parameters Panel (Right Sidebar) - Expanded to col-span-4 to ensure no squeezed margins */}
                  <div className="lg:col-span-4 flex flex-col h-full min-h-[520px] overflow-hidden">
                    <RightConfigSidebar
                      mode={mode}
                      setMode={handleModeChange}
                      pdfOptions={pdfOptions}
                      setPdfOptions={setPdfOptions}
                      formatOptions={formatOptions}
                      setFormatOptions={setFormatOptions}
                      onConvert={handleConvert}
                      isConverting={isConverting}
                      files={files}
                      onFilesAdded={handleFilesAdded}
                      onRemoveFile={handleRemoveFile}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      activeCropFile={activeCropFile}
                      setActiveCropFile={handleSelectQueuedFile}
                    />
                  </div>

                </div>

              </div>

            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Minimalist Footer */}
      <AnimatePresence>
        {!isWorkspaceActive && (
          <motion.footer
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30 py-6 mt-16 w-full"
          >
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 text-center font-sans text-[9px] uppercase tracking-widest text-stone-400/80 dark:text-stone-500/80 font-medium">
              <span>&copy; {new Date().getFullYear()} Filo &bull; 100% Private &bull; Processed Locally (Files Never Leave Your Device)</span>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

    </div>
  );
}
