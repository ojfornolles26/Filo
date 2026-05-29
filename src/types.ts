/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FiloFile {
  id: string;
  fileObject: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
  status: 'idle' | 'converting' | 'completed' | 'failed';
  errorMessage?: string;
  extractedText?: string;
  pageCount?: number;
}

export type ConversionMode = 'images-to-pdf' | 'pdf-to-formats';

export interface ImageToPdfOptions {
  pageFormat: 'a4' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 0 | 10 | 20; // Margin in mm
  quality: number; // 0.5 to 1.0
  pdfTitle: string;
}

export interface PdfToFormatOptions {
  targetFormat: 'png' | 'jpeg' | 'txt' | 'md';
  pageRange: string; // 'all' or custom like '1, 2-5'
  resolutionScale: 1 | 2 | 3;
}

export interface ConversionResult {
  fileName: string;
  fileSize: number;
  url: string;
  downloadName: string;
  type: string; // mime-type
  originalFileNames: string[];
}
