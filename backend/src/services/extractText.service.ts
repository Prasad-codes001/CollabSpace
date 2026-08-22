function decodeXmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractParagraphs(xmlString: string): string[] {
  return [...xmlString.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)]
    .map((match) => [...match[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
      .map((textMatch) => decodeXmlText(textMatch[1]))
      .join(''))
    .filter(Boolean);
}

export function extractDocxText(xmlString: string): string {
  try {
    return extractParagraphs(xmlString).join('\n\n');
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

export function convertDocxToHtml(xmlString: string): string {
  try {
    return extractParagraphs(xmlString).map((text) => `<p>${text}</p>`).join('\n');
  } catch (error) {
    console.error('DOCX to HTML conversion error:', error);
    return '';
  }
}

export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  // Fallback: return filename as text content for PDFs
  // Proper PDF text extraction requires pdf-lib or similar library
  // This will be updated when proper PDF support is added
  return `Uploaded PDF: ${fileBuffer.toString('utf-8').substring(0, 50)}`;
}