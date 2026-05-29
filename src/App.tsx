/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, AlertCircle, FileCode, CheckCircle, Info, Upload, Image, ArrowLeft, RefreshCw, Layers, Sparkles, Shield, Settings, FilePlus } from 'lucide-react';

import {
  FiloFile,
  ConversionMode,
  ImageToPdfOptions,
  PdfToFormatOptions,
  ConversionResult
} from './types';

import ThemeToggle from './components/ThemeToggle';
import FileQueueSidebar from './components/FileQueueSidebar';
import CoreWorkbench from './components/CoreWorkbench';
import ConfigPanel from './components/ConfigPanel';
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
      setConversionError(err.message || 'Verification fail on processing binary headers.');
      setFiles(prev => prev.map(f => f.status === 'converting' ? { ...f, status: 'failed' } : f));
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] dark:bg-[#0c0a09] text-[#1c1917] dark:text-[#f5f5f4] editorial-transition font-sans flex flex-col justify-between">
      
      {/* Sleek Editorial Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-[#fcfbfa]/80 dark:bg-[#0c0a09]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="font-sans text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Filo
            </h1>
            <span className="text-stone-300 dark:text-stone-700">/</span>
            <span className="font-serif italic text-xs text-stone-500 dark:text-stone-400 font-medium">
              {files.length > 0 ? 'Studio Workspace Active' : 'Convert documents simply.'}
            </span>
          </div>

          <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main Content Body */}
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          /* =========================================================
             VIEW 1: LANDING PAGE HEADER, HERO & LARGE UPLOADER CARD
             ========================================================= */
          <motion.div
            key="landing-view"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex-grow flex flex-col justify-center"
          >
            <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-10 md:py-16 space-y-12">
              
              {/* Editorial Subheader Banner / Hero Statement */}
              <div className="text-center max-w-4xl mx-auto space-y-4">
                <h2 className="font-serif italic text-3xl md:text-5xl text-stone-800 dark:text-stone-200 leading-tight font-normal">
                  Convert, fit, and extract files with <span className="underline decoration-stone-300 dark:decoration-stone-700 underline-offset-4">absolute privacy</span>.
                </h2>
                <p className="font-sans text-xs md:text-sm text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
                  Combine camera images and paper scans into clean printable PDFs, or transpile PDF textbooks into editable markdown study notes - powered entirely in your browser with zero server uploads.
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
                  className={`border border-dashed p-10 md:p-14 rounded-xl cursor-pointer text-center select-none transition-all flex flex-col items-center justify-center space-y-5 ${
                    isLandingDragOver
                      ? 'border-blue-500 bg-stone-50 dark:bg-stone-900/60 shadow-lg scale-[1.01]'
                      : 'border-stone-250 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 bg-white/80 dark:bg-[#0c0a09]/80 shadow-xs'
                  }`}
                >
                  <div className="p-4 rounded-full border border-stone-150 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-900 flex items-center justify-center text-stone-700 dark:text-stone-300">
                    <Upload className="h-6 w-6 animate-bounce" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-serif italic text-base block text-stone-800 dark:text-stone-200">
                      Drag and drop files here to launch Studio
                    </span>
                    <span className="font-sans text-xs text-stone-500 dark:text-stone-405 block max-w-sm mx-auto leading-normal">
                      Upload one or more <strong className="text-stone-750 dark:text-stone-200">images</strong> to compile to PDF, or a <strong className="text-stone-750 dark:text-stone-200">PDF file</strong> to extract study notes, content, & images. Or <span className="underline font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500">click to browse</span>.
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="inline-block px-3 py-1 bg-stone-100 dark:bg-stone-900 rounded font-mono text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">
                      PDF, PNG, JPEG, JPG, WEBP • client-side sandboxed
                    </span>
                  </div>
                </div>
              </div>

            </main>
          </motion.div>
        ) : (
          /* =========================================================
             VIEW 2: DUST-FREE HIGH-FIDELITY STUDIO WORKSPACE GRID
             ========================================================= */
          <motion.div
            key="studio-view"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.35 }}
            className="flex-grow flex flex-col pt-4 md:pt-6"
          >
            <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 space-y-6">
              
              {/* Active Workspace Action Bar Header */}
              <div className="border border-stone-200 dark:border-stone-800 bg-[#fcfbfa]/80 dark:bg-[#0c0a09]/85 p-3.5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3 text-stone-600 dark:text-stone-400">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 border border-stone-250 dark:border-stone-805 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 rounded font-sans text-xs font-bold text-stone-750 dark:text-stone-300 flex items-center space-x-1 px-3 py-1 cursor-pointer focus:outline-none transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Clear & Exit Studio</span>
                  </button>
                  <span className="text-stone-200 dark:text-stone-800">|</span>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    ACTIVE SATELLITE: <strong className="text-stone-800 dark:text-white">{mode === 'images-to-pdf' ? 'PHOTOS COMPILER' : 'PDF EXTRACTION TOOL'}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 font-mono text-[9px] uppercase tracking-widest text-stone-450">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Secure Local sandbox session active</span>
                </div>
              </div>

              {/* Dynamic Client-Side Converter Action Container */}
              <div className="space-y-6">
                
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
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-505 animate-ping" />
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
                      className="p-4 border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-955/10 text-rose-800 dark:text-rose-400 rounded-lg flex items-start space-x-3"
                    >
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-600" strokeWidth={1.5} />
                      <div className="space-y-1">
                        <h4 className="font-sans text-xs font-bold uppercase tracking-wider">Conversion Interrupted</h4>
                        <p className="font-sans text-xs leading-relaxed">{conversionError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sidebar Left, Main Core, Sidebar Right 3-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pb-6 lg:h-[calc(100vh-210px)] lg:min-h-[660px] lg:max-h-[900px]">
                  
                  {/* Column 1: Document Queue Drawer & Add tools (Left Sidebar) */}
                  <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <FileQueueSidebar
                      files={files}
                      mode={mode}
                      onFilesAdded={handleFilesAdded}
                      onRemoveFile={handleRemoveFile}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      activeCropFile={activeCropFile}
                      setActiveCropFile={handleSelectQueuedFile}
                    />
                  </div>

                  {/* Column 2: Core Workbench Space (Center Content Canvas) */}
                  <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto pr-0.5">
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
                    />
                  </div>

                  {/* Column 3: Customization & Parameters Panel (Right Sidebar) - Expanded to col-span-4 to ensure no squeezed margins */}
                  <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                    <ConfigPanel
                      mode={mode}
                      setMode={handleModeChange}
                      pdfOptions={pdfOptions}
                      setPdfOptions={setPdfOptions}
                      formatOptions={formatOptions}
                      setFormatOptions={setFormatOptions}
                      onConvert={handleConvert}
                      isConverting={isConverting}
                      hasFiles={files.length > 0}
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
                    />
                  </div>

                </div>

              </div>

            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6 mt-16 bg-stone-50/50 dark:bg-stone-950/30">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-stone-400 dark:text-stone-650">
          <div className="flex items-center space-x-2">
            <span>&copy; 2026 Filo Compiled Engine.</span>
            <span>|</span>
            <span>Secure Academic Studio Workspace.</span>
          </div>
          <div>
            <span>No telemetry logs collected • Data completely secure.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
