/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, AlertCircle, FileCode, CheckCircle, Info, Upload, Image, ArrowLeft, RefreshCw, FileStack, Sparkles, Shield, Settings, FilePlus, X, Sliders, Layout } from 'lucide-react';

import ThemeToggle from './components/ThemeToggle';
import LeftToolsSidebar from './components/LeftToolsSidebar';
import CoreWorkbench from './components/CoreWorkbench';
import RightConfigSidebar from './components/RightConfigSidebar';
import ConversionOverview from './components/ConversionOverview';
import FaqSection from './components/FaqSection';
import LegalModal from './components/LegalModal';

import { compileImagesToPdf } from './utils/converter';
import { parsePdfClientSide, extractPdfPagesToImages, synthesizeTxtFile, synthesizeMarkdownFile } from './utils/pdfParser';

const getMimeFromExtension = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
};

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState(null);
  const [mode, setMode] = useState('images-to-pdf');
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('canvas');
  
  // Landing Page Interactive Inputs & Drag Over States
  const landingFileInputRef = useRef(null);
  const [isLandingDragOver, setIsLandingDragOver] = useState(false);

  const handleLandingDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsLandingDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsLandingDragOver(false);
    }
  };

  const handleLandingDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLandingDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleLandingChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const triggerLandingBrowse = () => {
    landingFileInputRef.current?.click();
  };
  
  // Compiler Options
  const [pdfOptions, setPdfOptions] = useState({
    pageFormat: 'fit',
    orientation: 'auto',
    margin: 0,
    quality: 0.85,
    pdfTitle: 'Filo_Document'
  });

  const [formatOptions, setFormatOptions] = useState({
    targetFormat: 'txt',
    pageRange: 'all',
    resolutionScale: 2
  });

  // Conversion States
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStep, setConversionStep] = useState('');
  const [conversionError, setConversionError] = useState(null);

  // Result States
  const [result, setResult] = useState(null);
  const [extractedText, setExtractedText] = useState(undefined);
  const [markdownText, setMarkdownText] = useState(undefined);

  // Crop States
  const [activeCropFile, setActiveCropFile] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState('free');
  const [cropFlipH, setCropFlipH] = useState(false);
  const [cropFlipV, setCropFlipV] = useState(false);
  const [cropShowGrid, setCropShowGrid] = useState(true);
  const [isCropping, setIsCropping] = useState(false);

  // Active Cropper actions registration reference
  const cropperActionsRef = useRef(null);

  const registerCropperActions = (actions) => {
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
    setIsCropping(false);
  }, [activeCropFile?.id]);

  const handleSaveCrop = (croppedFile, previewUrl, size) => {
    if (!activeCropFile) return;

    const updatedFile = {
      ...activeCropFile,
      fileObject: croppedFile,
      previewUrl: previewUrl,
      size: size,
      status: 'idle'
    };

    setFiles(prev => prev.map(f => f.id === activeCropFile.id ? updatedFile : f));
    setActiveCropFile(updatedFile);
    setResult(null); // Clear outdated compile bounds
    setIsCropping(false);
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
    
    if (savedTheme === 'dark') {
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
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setResult(null);
    setExtractedText(undefined);
    setMarkdownText(undefined);
    setConversionError(null);
    // Delay switching tabs slightly so the workspace exit transition completes out of view
    setTimeout(() => {
      setActiveTab('canvas');
    }, 200);
  };

  // Custom function to select queued file and dynamically swap configuration view
  const handleSelectQueuedFile = (file) => {
    setActiveCropFile(file);
    if (file) {
      if (file.type === 'application/pdf') {
        setMode('pdf-to-formats');
      } else if (file.type.startsWith('image/')) {
        setMode('images-to-pdf');
      }
      // Delay switching tabs slightly so the workspace exit transition completes out of view
      setTimeout(() => {
        setActiveTab('canvas');
      }, 200);
    }
  };

  // Drag and drop handler
  const handleFilesAdded = (fileList) => {
    if (fileList.length === 0) return;

    let determinedMode = mode;

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

    const newFiloFiles = [];
    
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
  const handleRemoveFile = (id) => {
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
  const handleMoveUp = (idx) => {
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
  const handleMoveDown = (idx) => {
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

  // Close success modal without flushing Queue
  const handleDismissResult = () => {
    setResult(null);
    setExtractedText(undefined);
    setMarkdownText(undefined);
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read PDF file binary contents.'));
      reader.readAsArrayBuffer(file);
    });
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

        setConversionStep('Reading PDF document...');
        const arrayBuffer = await readFileAsArrayBuffer(targetPdf.fileObject);

        const parsed = await parsePdfClientSide(arrayBuffer, targetPdf.name, (pct, msg) => {
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
          setConversionStep('Rendering PDF pages...');
          const { blob, fileName } = await extractPdfPagesToImages(
            arrayBuffer,
            formatOptions.targetFormat,
            formatOptions.resolutionScale,
            (pct, msg) => {
              setConversionProgress(pct);
              setConversionStep(msg);
            }
          );

          const blobUrl = URL.createObjectURL(blob);
          setExtractedText(`Successfully converted PDF to images!\n\nExtracted: ${parsed.pageCount} pages\nFile size: ${(blob.size / 1024 / 1024).toFixed(2)} MB\nArchive: ${fileName}`);
          setMarkdownText(undefined);

          setResult({
            fileName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_images_${formatOptions.targetFormat}.zip`,
            fileSize: blob.size,
            url: blobUrl,
            downloadName: `${targetPdf.name.replace(/\.pdf$/gi, '')}_images_${formatOptions.targetFormat}.zip`,
            type: 'application/zip',
            originalFileNames: [targetPdf.name]
          });
        }

        setFiles(prev => prev.map(f => f.id === targetPdf.id ? { ...f, status: 'completed' } : f));
      }
    } catch (err) {
      console.error(err);
      setConversionError(err.message || 'Unable to read the PDF file. It may be corrupted or password-protected.');
      setFiles(prev => prev.map(f => f.status === 'converting' ? { ...f, status: 'failed' } : f));
    } finally {
      setIsConverting(false);
    }
  };

  const isWorkspaceActive = files.length > 0;

  return (
    <div className={`relative bg-[#f7f5f0] dark:bg-[#0c0a09] text-[#1c1917] dark:text-[#f5f5f4] editorial-transition font-sans flex flex-col ${
      isWorkspaceActive ? 'h-[100dvh] overflow-hidden' : 'min-h-screen justify-start'
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

      
      {/* Sleek Editorial Header - Visible on mobile when workspace is active, but hidden on desktop workspace */}
      <header className={`border-b border-stone-200 dark:border-stone-800 bg-[#f7f5f0]/80 dark:bg-[#0c0a09]/80 backdrop-blur-md sticky top-0 z-30 w-full shrink-0 ${
        isWorkspaceActive ? 'lg:hidden' : ''
      }`}>
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {isWorkspaceActive ? (
            <div className="grid grid-cols-3 items-center w-full">
              {/* Left: Exit button */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-300 dark:bg-stone-900 dark:hover:bg-stone-800 dark:active:bg-stone-700/60 border border-stone-200/60 dark:border-stone-800/80 rounded-lg font-sans text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 flex items-center space-x-1.5 cursor-pointer focus:outline-none transition-all shadow-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Exit Workspace</span>
                  <span className="sm:hidden">Exit</span>
                </button>
              </div>

              {/* Center: Logo */}
              <div className="flex justify-center items-center space-x-1.5 select-none">
                <div className="h-6 w-6 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-xs">
                  <FileText className="h-3 w-3 text-white" strokeWidth={2} />
                </div>
                <div className="font-brand italic text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Filo
                </div>
              </div>

              {/* Right: Theme Toggle */}
              <div className="flex justify-end items-center">
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-xs select-none">
                  <FileText className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="font-brand italic text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 select-none">
                  Filo
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
              </div>
            </div>
          )}
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
            initial={{ opacity: 0, scale: 0.985, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-grow flex flex-col justify-start"
          >
            <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-10 md:py-16 space-y-12">
              
              {/* Editorial Subheader Banner / Hero Statement */}
              <div className="text-center max-w-4xl mx-auto space-y-4">
                <h1 className="font-sans text-4xl md:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                  Convert and extract documents with <span className="font-brand italic font-semibold text-blue-600 dark:text-blue-400">absolute privacy</span>.
                </h1>
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
                  className={`border-2 border-dashed backdrop-blur-md p-10 md:p-14 rounded-2xl cursor-pointer text-center select-none transition-all duration-300 flex flex-col items-center justify-center space-y-5 ${
                    isLandingDragOver
                      ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/15 shadow-md scale-[1.01]'
                      : 'border-stone-300 dark:border-stone-700/80 hover:border-blue-500/60 dark:hover:border-blue-400/50 bg-white/40 dark:bg-stone-950/20 hover:bg-white/60 dark:hover:bg-stone-950/30 shadow-xs hover:shadow-sm'
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
                <div className="p-5 bg-white/70 dark:bg-stone-900/60 backdrop-blur-md border border-stone-200 dark:border-stone-800/85 rounded-2xl space-y-2.5 transition-all duration-350 hover:bg-white/80 dark:hover:bg-stone-900/85 shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center">
                      <Image className="h-4 w-4" />
                    </div>
                    <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                      Create PDFs
                    </h3>
                  </div>
                  <p className="font-sans text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                    Compile multiple images (PNG, JPG, WebP) into structured, high-quality PDFs. Adjust page settings (A4, Letter, or Fit), margins, orientation, and crop elements in real-time.
                  </p>
                </div>

                <div className="p-5 bg-white/70 dark:bg-stone-900/60 backdrop-blur-md border border-stone-200 dark:border-stone-800/85 rounded-2xl space-y-2.5 transition-all duration-350 hover:bg-white/80 dark:hover:bg-stone-900/85 shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                      Extract Content
                    </h3>
                  </div>
                  <p className="font-sans text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                    Pull structured text and layout directories out of PDF files. Convert documents directly into Markdown notes or clean Plain Text, choosing custom page ranges.
                  </p>
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <FaqSection />

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
                      key="progress-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-[#0c0a09]/30 dark:bg-[#0c0a09]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                      <motion.div
                        id="conversion-progress-box"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md p-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-xl shadow-xl space-y-3"
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result Block */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      key="result-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleDismissResult}
                      className="fixed inset-0 bg-[#0c0a09]/45 dark:bg-[#0c0a09]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
                    >
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-xl shadow-xl select-text"
                      >
                        <ConversionOverview
                          result={result}
                          extractedText={extractedText}
                          markdownText={markdownText}
                          onReset={handleReset}
                          onClose={handleDismissResult}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Conversion Error Alerts */}
                <AnimatePresence>
                  {conversionError && (
                    <motion.div
                      key="error-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-[#0c0a09]/20 dark:bg-[#0c0a09]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                      onClick={() => setConversionError(null)}
                    >
                      <motion.div
                        id="conversion-error-alert"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md p-5 border border-rose-200 dark:border-rose-950 bg-white dark:bg-stone-950 text-rose-800 dark:text-rose-400 rounded-xl shadow-xl flex items-start justify-between space-x-3"
                      >
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                          <div className="space-y-1">
                            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">Conversion Interrupted</h4>
                            <p className="font-sans text-xs leading-relaxed text-stone-600 dark:text-stone-400">{conversionError}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConversionError(null)}
                          className="p-1 rounded-md hover:bg-rose-100/50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 transition-colors cursor-pointer focus:outline-none"
                          aria-label="Dismiss error"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sidebar Left, Main Core, Sidebar Right 3-Column Layout */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pb-4 overflow-hidden">
                  
                  {/* Column 1: Document Queue Drawer & Add tools (Left Sidebar) - Desktop Only */}
                  <div className="lg:col-span-3 hidden lg:flex flex-col h-full lg:min-h-[520px] min-h-0 overflow-hidden">
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
                      isCropping={isCropping}
                      setIsCropping={setIsCropping}
                      isDark={isDark}
                      toggleTheme={toggleTheme}
                    />
                  </div>

                  {/* Column 2: Core Workbench Space (Center Content Canvas) - Visible on mobile when activeTab is 'canvas' */}
                  <div className={`lg:col-span-5 flex flex-col h-full lg:min-h-[520px] min-h-0 overflow-hidden ${activeTab === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
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
                      isCropping={isCropping}
                      setIsCropping={setIsCropping}
                      onCropSaveGlobal={handleCropSave}
                    />
                  </div>

                  {/* Column 3: Customization & Parameters Panel (Right Sidebar) - Visible on mobile when activeTab is 'settings' */}
                  <div className={`lg:col-span-4 flex flex-col h-full lg:min-h-[520px] min-h-0 overflow-hidden ${activeTab === 'settings' ? 'flex' : 'hidden lg:flex'}`}>
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

                {/* Mobile Bottom Navigation Tab Bar */}
                <div className="lg:hidden shrink-0 border-t border-stone-200 dark:border-stone-800/60 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md py-2 px-6 flex items-center justify-around -mx-4 -mb-4 select-none z-20">
                  <button
                    type="button"
                    onClick={() => setActiveTab('canvas')}
                    className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl cursor-pointer transition-colors focus:outline-none ${
                      activeTab === 'canvas'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                  >
                    <Layout className="h-5 w-5" strokeWidth={activeTab === 'canvas' ? 2.2 : 1.6} />
                    <span className="font-sans text-[10px] font-bold tracking-wide uppercase">Workspace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center space-y-1 py-1 px-4 rounded-xl cursor-pointer transition-colors focus:outline-none relative ${
                      activeTab === 'settings'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                  >
                    <FileStack className="h-5 w-5" strokeWidth={activeTab === 'settings' ? 2.2 : 1.6} />
                    <span className="font-sans text-[10px] font-bold tracking-wide uppercase">Queue</span>
                    {files.length > 0 && (
                      <span className="absolute -top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs border border-white dark:border-stone-900">
                        {files.length}
                      </span>
                    )}
                  </button>
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
            key="footer"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30 py-6 mt-16 w-full"
          >
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 text-center font-sans text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-medium space-y-2">
              <div>
                &copy; {new Date().getFullYear()} Filo &bull; Processed locally for absolute privacy
              </div>
              <div className="flex items-center justify-center space-x-4 font-bold">
                <button
                  type="button"
                  onClick={() => setActiveLegalDoc('privacy')}
                  className="text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  Privacy Policy
                </button>
                <span className="text-stone-300 dark:text-stone-800">&bull;</span>
                <button
                  type="button"
                  onClick={() => setActiveLegalDoc('terms')}
                  className="text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  Terms of Service
                </button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Legal Policy Modals */}
      <LegalModal type={activeLegalDoc} onClose={() => setActiveLegalDoc(null)} />
    </div>
  );
}
