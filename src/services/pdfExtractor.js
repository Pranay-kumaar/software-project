// PDF Text Extraction Service using pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extracts text content from a PDF file.
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} The extracted text content
 */
export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('[PDFExtractor] Failed to extract text from PDF:', error);
    throw new Error(`Failed to read PDF: ${error.message}. Please make sure the file is a valid PDF.`);
  }
}

/**
 * Validates that a file is a PDF and within size limits.
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePDFFile(file, maxSizeMB = 10) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Please upload a PDF file.' };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File is too large. Maximum size is ${maxSizeMB}MB.` };
  }

  return { valid: true };
}
