/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Vite-specific worker loading using asset url import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParsedPdfResult {
  pageCount: number;
  title: string | null;
  author: string | null;
  creator: string | null;
  textByPage: string[];
  allText: string;
  isScannedOrGraphicsOnly: boolean;
  fileSize: number;
}

/**
 * Standard PDF text and metadata extractor
 */
export const parsePdfClientSide = async (
  fileData: ArrayBuffer,
  fileName: string,
  onProgress: (percent: number, stepLabel: string) => void
): Promise<ParsedPdfResult> => {
  onProgress(10, 'Opening PDF document...');
  
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: fileData,
      useSystemFonts: true
    });

    loadingTask.onProgress = (progressData) => {
      if (progressData && progressData.total > 0) {
        const percent = Math.floor((progressData.loaded / progressData.total) * 20) + 10;
        onProgress(percent, 'Retrieving layout structures...');
      }
    };

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    onProgress(35, 'Extracting metadata details...');
    const metadata = await pdfDoc.getMetadata();
    const info = metadata?.info as any;
    const title = info?.Title || null;
    const author = info?.Author || null;
    const creator = info?.Creator || null;

    const textByPage: string[] = [];
    
    for (let i = 1; i <= pageCount; i++) {
      const percent = Math.floor(40 + (i / pageCount) * 55);
      onProgress(percent, `Reading page ${i} of ${pageCount}...`);
      
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      // Map text items to string segments
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      textByPage.push(pageText);
    }

    const allText = textByPage.join('\n\n');
    const isScannedOrGraphicsOnly = allText.trim().length < 20;

    onProgress(100, 'Parsing complete');

    return {
      pageCount,
      title: title || fileName.replace(/\.pdf$/gi, ''),
      author: author || 'Unknown author',
      creator: creator || 'Unknown system',
      textByPage,
      allText: isScannedOrGraphicsOnly ? '' : allText,
      isScannedOrGraphicsOnly,
      fileSize: fileData.byteLength
    };
  } catch (err: any) {
    console.error('PDF.js client extraction failed:', err);
    throw new Error(err.message || 'Standard parser failed to read PDF contents. The file may be password-protected or corrupted.');
  }
};

/**
 * Render PDF pages onto canvas and bundle them into a ZIP archive
 */
export const extractPdfPagesToImages = async (
  fileData: ArrayBuffer,
  targetFormat: 'png' | 'jpeg',
  resolutionScale: number,
  onProgress: (percent: number, stepLabel: string) => void
): Promise<{ blob: Blob; fileName: string }> => {
  onProgress(10, 'Initializing page drawing engine...');
  
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: fileData,
      useSystemFonts: true
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const zip = new JSZip();
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas 2D context creation failed.');
    }

    for (let i = 1; i <= pageCount; i++) {
      const renderPercent = Math.floor(15 + (i / pageCount) * 75);
      onProgress(renderPercent, `Rendering page ${i} of ${pageCount} to canvas...`);
      
      const page = await pdfDoc.getPage(i);
      
      // Calculate viewport dimensions according to resolution scale (e.g. 1x, 2x, 3x)
      const viewport = page.getViewport({ scale: resolutionScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      // Render layout to canvas context
      await page.render(renderContext).promise;
      
      const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, targetFormat === 'jpeg' ? 0.92 : undefined);
      const base64Data = dataUrl.split(',')[1];
      
      // Add image file to the ZIP folder
      zip.file(`page_${i.toString().padStart(3, '0')}.${targetFormat}`, base64Data, { base64: true });
    }

    onProgress(92, 'Generating ZIP archive in memory...');
    const blob = await zip.generateAsync({ type: 'blob' });
    
    onProgress(100, 'Archive built successfully');
    
    return {
      blob,
      fileName: `pages_${targetFormat}_bundle.zip`
    };
  } catch (err: any) {
    console.error('Canvas page extraction failed:', err);
    throw new Error(err.message || 'Image rendering engine failed to compile PDF pages.');
  }
};

/**
 * Generate structural plain text from parsed results
 */
export const synthesizeTxtFile = (parsed: ParsedPdfResult): { text: string; blobUrl: string } => {
  let output = '';
  output += `==================================================\n`;
  output += `CONVERTED TEXT FROM PDF\n`;
  output += `Document Name: ${parsed.title || 'Untitled Document'}\n`;
  output += `Total Pages: ${parsed.pageCount} | Written By: ${parsed.author || 'Unknown'}\n`;
  output += `Converted On: ${new Date().toLocaleDateString()}\n`;
  output += `==================================================\n\n`;

  if (parsed.isScannedOrGraphicsOnly) {
    output += `[NOTE: This PDF looks like it contains scanned pages or images, rather than selectable text. To view or save these pages, try selecting the 'PNG Images (.zip)' or 'JPEG Images (.zip)' format instead so you can see them as pictures!]\n`;
  } else {
    parsed.textByPage.forEach((pageText, idx) => {
      output += `--- PAGE ${idx + 1} ---\n`;
      output += pageText.trim() ? pageText : '[No text found on this page]';
      output += `\n\n`;
    });
  }

  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  return {
    text: output,
    blobUrl: URL.createObjectURL(blob)
  };
};

/**
 * Generate structural markdown from parsed results
 */
export const synthesizeMarkdownFile = (parsed: ParsedPdfResult): { markdown: string; blobUrl: string } => {
  let md = '';
  md += `# ${parsed.title || 'Untitled Document'}\n\n`;
  md += `> **Document Information**\n`;
  md += `> - **Format**: Formatted Document (Markdown Notes)\n`;
  md += `> - **Total Pages**: ${parsed.pageCount}\n`;
  md += `> - **Author**: ${parsed.author || 'Unknown'}\n`;
  md += `> - **Created using**: Filo Document App\n\n`;
  md += `---\n\n`;

  if (parsed.isScannedOrGraphicsOnly) {
    md += `### Scanned Document Notice\n\n`;
    md += `*Note: This PDF was created from picture images or scanned pages, so there is no directly selectable text for this markdown file.* \n\n`;
    md += `To save these pages as images instead, try converting to **PNG/JPEG** images inside the app.\n`;
  } else {
    parsed.textByPage.forEach((pageText, idx) => {
      md += `## Section ${idx + 1}\n\n`;
      
      const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        // Treat first line as heading if it's short, else standard paragraph
        if (lines[0].length < 60 && !lines[0].endsWith('.')) {
          md += `### ${lines[0]}\n\n`;
          md += lines.slice(1).map(line => {
            // Check if it looks like list item
            if (line.match(/^\d+\.?\s/) || line.startsWith('-') || line.startsWith('*')) {
              return line;
            }
            return line + '  '; // soft wrap
          }).join('\n\n');
        } else {
          md += lines.map(line => {
            if (line.match(/^\d+\.?\s/) || line.startsWith('-') || line.startsWith('*')) {
              return line;
            }
            return line + '  ';
          }).join('\n\n');
        }
      } else {
        md += `*This page contains picture graphics or empty margins.*\n`;
      }
      md += `\n\n---\n\n`;
    });
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  return {
    markdown: md,
    blobUrl: URL.createObjectURL(blob)
  };
};
