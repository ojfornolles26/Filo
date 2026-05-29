/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Download, CheckCircle, Copy, Check, RefreshCw, Eye, EyeOff, FileText, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConversionResult } from '../types';

interface ConversionOverviewProps {
  result: ConversionResult | null;
  extractedText?: string;
  markdownText?: string;
  onReset: () => void;
}

export default function ConversionOverview({
  result,
  extractedText,
  markdownText,
  onReset
}: ConversionOverviewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'txt' | 'md' | 'meta'>('meta');
  const [isOpenPreview, setIsOpenPreview] = useState(false);

  if (!result) return null;

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const currentPreviewText = activeTab === 'txt' ? extractedText : markdownText;

  const handleCopy = async () => {
    const textToCopy = currentPreviewText || '';
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  return (
    <motion.div
      id="conversion-result-card"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6 rounded-lg space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-sans text-sm font-bold text-stone-900 dark:text-stone-50">
              Your converted file is ready!
            </h3>
            <p className="font-sans text-xs text-stone-500 dark:text-stone-400">
              Successfully converted inside your browser. No files were uploaded!
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-3 py-1.5 rounded border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-transparent text-xs text-stone-700 dark:text-stone-300 font-medium cursor-pointer transition-colors focus:outline-none"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Convert more files</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-stone-100 dark:border-stone-900 pt-5">
        
        {/* Output Document Card */}
        <div className="md:col-span-2 border border-stone-200 dark:border-stone-800 rounded p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold block">
              YOUR DOWNLOADABLE FILE
            </span>
            <h4 id="result-filename" className="font-sans text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">
              {result.fileName}
            </h4>
            <div className="flex items-center space-x-2 font-mono text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span>Size: {formatSize(result.fileSize)}</span>
              <span>•</span>
              <span className="uppercase text-blue-600 dark:text-blue-400 font-semibold">{result.fileName.split('.').pop()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <a
              id="download-result-link"
              href={result.url}
              download={result.downloadName}
              className="flex-1 py-2 px-4 bg-stone-900 hover:bg-stone-800 border border-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200/90 rounded text-center text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none flex items-center justify-center space-x-2 shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              <span>Download File Now</span>
            </a>

            {(extractedText || markdownText) && (
              <button
                id="toggle-preview-btn"
                onClick={() => setIsOpenPreview(!isOpenPreview)}
                className="p-2 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 rounded cursor-pointer transition-colors focus:outline-none flex items-center justify-center bg-transparent"
                title={isOpenPreview ? "Hide preview" : "Preview extracted text"}
              >
                {isOpenPreview ? (
                  <EyeOff className="h-4 w-4 text-stone-600 dark:text-stone-400" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4 text-stone-600 dark:text-stone-400" strokeWidth={1.5} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Original files list */}
        <div className="border border-stone-200 dark:border-stone-800 rounded p-4 bg-stone-50/50 dark:bg-stone-900/10 space-y-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-bold block">
            Original files used
          </span>
          <div className="overflow-y-auto max-h-[100px] space-y-1.5 custom-scrollbar pr-1">
            {result.originalFileNames.map((name, i) => (
              <div key={i} className="flex items-center space-x-2 text-stone-600 dark:text-stone-400 truncate">
                <span className="font-mono text-[9px] text-stone-300 dark:text-stone-700">{(i + 1).toString().padStart(2, '0')}</span>
                <span className="font-sans text-xs truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* In-app Text Payload Inspector Drawer */}
      <AnimatePresence>
        {isOpenPreview && (extractedText || markdownText) && (
          <motion.div
            id="payload-inspector-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border border-stone-200 dark:border-stone-800 rounded bg-stone-50/20 dark:bg-stone-950/40 p-4 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 dark:border-stone-950 pb-3 gap-2">
              <div className="flex items-center space-x-1 bg-stone-100 dark:bg-stone-900 p-0.5 rounded border border-stone-200/30 dark:border-stone-800/60 max-w-fit">
                {extractedText && (
                  <button
                    id="tab-select-txt"
                    onClick={() => setActiveTab('txt')}
                    className={`py-1 px-3 rounded text-xs font-semibold cursor-pointer focus:outline-none transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'txt'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-400'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>Plain Text (Just text)</span>
                  </button>
                )}
                {markdownText && (
                  <button
                    id="tab-select-md"
                    onClick={() => setActiveTab('md')}
                    className={`py-1 px-3 rounded text-xs font-semibold cursor-pointer focus:outline-none transition-colors flex items-center space-x-1.5 ${
                      activeTab === 'md'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-50 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-400'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>Formatted Text (Markdown)</span>
                  </button>
                )}
              </div>

              <button
                id="copy-text-btn"
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 rounded text-xs font-medium cursor-pointer focus:outline-none transition-all mr-auto sm:mr-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>Copy to clipboard</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-stone-950 text-stone-100 rounded border border-stone-900 overflow-x-auto font-mono text-[11px] leading-relaxed max-h-[300px] overflow-y-auto select-text scrollbar-thin scrollbar-thumb-stone-800">
                {currentPreviewText || '// Empty element buffer'}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-500 italic">
              <span>Lines: {(currentPreviewText || '').split('\n').length}</span>
              <span>Characters: {(currentPreviewText || '').length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
