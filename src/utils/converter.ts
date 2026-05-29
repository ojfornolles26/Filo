/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { FiloFile, ImageToPdfOptions, ConversionResult } from '../types';

const readAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
};

const getImageDimensions = (base64Url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Url;
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image dimensions'));
  });
};

// Help map mime types to jsPDF image formats
const getJsPdfImageFormat = (mimeType: string): string => {
  const t = mimeType.toLowerCase();
  if (t.includes('png')) return 'PNG';
  if (t.includes('webp')) return 'WEBP';
  return 'JPEG'; // Default fallback
};

export const compileImagesToPdf = async (
  files: FiloFile[],
  options: ImageToPdfOptions,
  onProgress: (percent: number, stepLabel: string) => void
): Promise<ConversionResult> => {
  const activeFiles = files.filter(f => f.status !== 'failed');
  if (activeFiles.length === 0) {
    throw new Error('No valid files to convert');
  }

  onProgress(5, 'Starting converter...');
  const total = activeFiles.length;
  let pdf: jsPDF | null = null;

  // Sizing definitions in mm
  const PAGE_SIZES = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 }
  };

  for (let i = 0; i < total; i++) {
    const filoFile = activeFiles[i];
    const fileNum = i + 1;
    onProgress(
      Math.floor(10 + (i / total) * 80),
      `Adding page ${fileNum} of ${total}: ${filoFile.name}`
    );

    try {
      // 1. Read file to Base64
      const base64Data = await readAsDataURL(filoFile.fileObject);
      
      // 2. Get image aspect ratio
      const { width: imgW, height: imgH } = await getImageDimensions(base64Data);
      const isLandscapeImage = imgW > imgH;

      // 3. Determine Page Setup and orientation
      let pageW = 210;
      let pageH = 297;
      let finalOrientation: 'portrait' | 'landscape' = 'portrait';

      if (options.orientation === 'auto') {
        finalOrientation = isLandscapeImage ? 'landscape' : 'portrait';
      } else {
        finalOrientation = options.orientation;
      }

      // Determine nominal size
      if (options.pageFormat === 'fit') {
        // Compute page size based directly on the image dimensions scaled to a reasonable printing width
        // Let's budget standard 300 DPI or fit inside a maximum limit of 300mm to preserve aspect ratio
        const baseWidthMm = 210; // Use A4 width as standard base
        pageW = baseWidthMm;
        pageH = baseWidthMm * (imgH / imgW);
        finalOrientation = pageW > pageH ? 'landscape' : 'portrait';
      } else {
        const nominal = PAGE_SIZES[options.pageFormat];
        if (finalOrientation === 'landscape') {
          pageW = nominal.height;
          pageH = nominal.width;
        } else {
          pageW = nominal.width;
          pageH = nominal.height;
        }
      }

      // 4. Create or append PDF page
      if (!pdf) {
        // First page
        pdf = new jsPDF({
          orientation: finalOrientation,
          unit: 'mm',
          format: options.pageFormat === 'fit' ? [pageW, pageH] : options.pageFormat
        });
      } else {
        // Subsequent page
        pdf.addPage(
          options.pageFormat === 'fit' ? [pageW, pageH] : options.pageFormat,
          finalOrientation
        );
      }

      // 5. Draw Image under proper margins & aspect ratio constraints
      const margin = options.margin; // 0, 10, or 20
      const usableW = pageW - (2 * margin);
      const usableH = pageH - (2 * margin);

      const pageAspect = usableW / usableH;
      const imgAspect = imgW / imgH;

      let drawW = usableW;
      let drawH = usableH;
      
      if (imgAspect > pageAspect) {
        drawW = usableW;
        drawH = usableW / imgAspect;
      } else {
        drawH = usableH;
        drawW = usableH * imgAspect;
      }

      // Center it inside the usable frame
      const x = margin + (usableW - drawW) / 2;
      const y = margin + (usableH - drawH) / 2;

      onProgress(
        Math.floor(10 + ((i + 0.5) / total) * 80),
        `Adding page ${fileNum} layout into the PDF...`
      );

      const format = getJsPdfImageFormat(filoFile.type);
      pdf.addImage(
        base64Data,
        format,
        x,
        y,
        drawW,
        drawH,
        undefined,
        options.quality === 1 ? 'NONE' : 'FAST'
      );

    } catch (err: any) {
      console.error(`Error adding image ${filoFile.name}:`, err);
      // We continue to compile other files but flag this one failed
      filoFile.status = 'failed';
      filoFile.errorMessage = err.message || 'Corrupted file format';
    }
  }

  if (!pdf) {
    throw new Error('No valid PDF pages could be constructed.');
  }

  onProgress(95, 'Saving your final PDF...');

  // Set document properties
  pdf.setProperties({
    title: options.pdfTitle || 'Filo Compilation',
    creator: 'Filo Document App'
  });

  const blob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(blob);
  const downloadName = `${(options.pdfTitle || 'Filo_Compilation').replace(/\s+/g, '_')}.pdf`;

  onProgress(100, 'Completed');

  return {
    fileName: downloadName,
    fileSize: blob.size,
    url: pdfUrl,
    downloadName,
    type: 'application/pdf',
    originalFileNames: activeFiles.map(f => f.name)
  };
};
