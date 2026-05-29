/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
 * Clean and parse PDF string nodes
 */
function cleanPdfString(raw: string): string {
  // Replace octal escapes (\377, etc) or common hex codes
  let cleaned = raw
    .replace(/\\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '')
    .replace(/\\f/g, '')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');

  // Handle PDF hex representation e.g. <414243> = ABC
  if (cleaned.startsWith('<') && cleaned.endsWith('>')) {
    const hex = cleaned.slice(1, -1);
    try {
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
    } catch {
      return cleaned;
    }
  }

  return cleaned;
}

export const parsePdfClientSide = async (
  file: File,
  onProgress: (percent: number, stepLabel: string) => void
): Promise<ParsedPdfResult> => {
  onProgress(10, 'Looking at document layout...');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        
        onProgress(30, 'Counting pages and design elements...');
        // 1. Pages detection
        // Standard PDFs store pages in trees with `/Count [num]` or `/Type /Pages`
        let pageCount = 0;
        
        // Count instances of /Type /Page (excluding /Pages) or look for /Count
        const countRegex = /\/Count\s+(\d+)/g;
        let match;
        let maxCount = 0;
        while ((match = countRegex.exec(text)) !== null) {
          const countVal = parseInt(match[1], 10);
          if (countVal > maxCount) {
            maxCount = countVal;
          }
        }
        
        const pageInstances = (text.match(/\/Type\s*\/Page\b/g) || []).length;
        pageCount = maxCount > 0 ? maxCount : (pageInstances > 0 ? pageInstances : 1);

        onProgress(50, 'Finding document title and author info...');
        // 2. Extract Document Metadata
        const titleMatch = text.match(/\/Title\s*(?:\(([^)]+)\)|<([^>]+)>)/);
        const authorMatch = text.match(/\/Author\s*(?:\(([^)]+)\)|<([^>]+)>)/);
        const creatorMatch = text.match(/\/Creator\s*(?:\(([^)]+)\)|<([^>]+)>)/);

        const title = titleMatch ? cleanPdfString(titleMatch[1] || titleMatch[2]) : null;
        const author = authorMatch ? cleanPdfString(authorMatch[1] || authorMatch[2]) : null;
        const creator = creatorMatch ? cleanPdfString(creatorMatch[1] || creatorMatch[2]) : null;

        onProgress(70, 'Reading written text from pages...');

        // 3. Extract text content
        // Standard searchable PDFs hold strings inside streams like `/BT` (begin text) and `ET` (end text)
        // Inside them, text is shown in parentheses e.g. `(Hello World) Tj` or `[(Hel) 5 (lo)] TJ`
        const textByPage: string[] = [];
        
        // Find streams
        const streamRegex = /stream[\r\n]+([\s\S]*?)endstream/g;
        let textFound = '';
        let streamCount = 0;
        
        while ((match = streamRegex.exec(text)) !== null && streamCount < 200) {
          streamCount++;
          const streamContent = match[1];
          
          // Look for Begin Text / End Text tags
          const textBlocks = streamContent.match(/\/BT[\s\S]*?ET/g);
          if (textBlocks) {
            for (const block of textBlocks) {
              // Capture anything between parenthetical text arrays [(...) Tj] or absolute (Tj) bounds
              const parentheticalMatches = block.match(/\(([^)]*)\)/g);
              if (parentheticalMatches) {
                const blockText = parentheticalMatches
                  .map(pm => pm.slice(1, -1)) // strip parentheses
                  .map(cleanPdfString)
                  .join(' ');
                textFound += blockText + '\n';
              }
            }
          }
        }

        onProgress(90, 'Combining text pages into a clean document...');

        // Build elegant list representing pages
        if (textFound.trim().length > 0) {
          // Splitting text found across approximate page counts
          const lines = textFound.split('\n').filter(l => l.trim().length > 0);
          const linesPerPage = Math.max(5, Math.ceil(lines.length / pageCount));
          
          for (let p = 0; p < pageCount; p++) {
            const pageLines = lines.slice(p * linesPerPage, (p + 1) * linesPerPage);
            textByPage.push(pageLines.join('\n'));
          }
        } else {
          // Try a simple search for regular plaintext parenthesis brackets if BT/ET wasn't structured properly
          const simpleTextMatches = text.match(/\(([^)]+)\)\s*(?:Tj|TJ)/g);
          if (simpleTextMatches && simpleTextMatches.length > 0) {
            const lines = simpleTextMatches
              .map(m => {
                const inner = m.match(/\(([^)]+)\)/);
                return inner ? cleanPdfString(inner[1]) : '';
              })
              .filter(l => l.trim().length > 0);

            const linesPerPage = Math.max(5, Math.ceil(lines.length / pageCount));
            for (let p = 0; p < pageCount; p++) {
              const pageLines = lines.slice(p * linesPerPage, (p + 1) * linesPerPage);
              textByPage.push(pageLines.join('\n'));
            }
          }
        }

        // Fill remaining pages if empty
        while (textByPage.length < pageCount) {
          textByPage.push('');
        }

        const allText = textByPage.join('\n\n');
        const isScannedOrGraphicsOnly = allText.trim().length < 20;

        onProgress(100, 'Finished!');

        resolve({
          pageCount,
          title: title || file.name.replace(/\.pdf$/gi, ''),
          author: author || 'Unknown author',
          creator: creator || 'Unknown system',
          textByPage,
          allText: isScannedOrGraphicsOnly ? '' : allText,
          isScannedOrGraphicsOnly,
          fileSize: file.size
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read binary PDF content.'));
    reader.readAsText(file); // This accesses literal text commands in PDF streams
  });
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
