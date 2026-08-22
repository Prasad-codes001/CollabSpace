export function extractDocxText(xmlString: string): string {
  try {
    const doc = Document.load(xmlString);
    const paragraphs: string[] = [];

    doc.forEach((element: any) => {
      if (element.type === 'paragraph') {
        const textRuns: string[] = [];
        element.forEach((child: any) => {
          if (child.type === 'text') {
            textRuns.push(child.text);
          }
        });
        if (textRuns.length > 0) {
          paragraphs.push(textRuns.join(''));
        }
      }
    });

    return paragraphs.join('\n\n');
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

export function convertDocxToHtml(xmlString: string): string {
  try {
    const doc = Document.load(xmlString);
    const htmlParts: string[] = [];

    doc.forEach((element: any) => {
      if (element.type === 'paragraph') {
        const children: any[] = [];
        element.forEach((child: any) => {
          if (child.type === 'text') {
            children.push({ type: 'text', text: child.text });
          }
        });

        let text = '';
        children.forEach((child: any) => {
          if (child.type === 'text') {
            text += child.text;
          }
        });

        if (text) {
          htmlParts.push(`<p>${text}</p>`);
        }
      }
    });

    return htmlParts.join('\n');
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