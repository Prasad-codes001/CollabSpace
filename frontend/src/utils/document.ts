import type { DocumentBlock } from '../types/document';

// Canonical content shape: a single "blk_main" block wrapping the raw TipTap HTML.
// Both the REST save path and the Socket.IO debounced save persist this same shape,
// so the document's persisted content is always consistent regardless of writer.
export function htmlToBlocks(html: string): DocumentBlock[] {
  return [{ id: 'blk_main', type: 'paragraph', content: html }];
}

// Convert persisted blocks back to editor HTML. Handles both the canonical
// "blk_main" blob (raw HTML) and legacy multi-block documents.
export function blocksToHtml(blocks: DocumentBlock[] | undefined, defaultTitle?: string): string {
  if (!blocks || blocks.length === 0) {
    const title = defaultTitle ? defaultTitle : 'Untitled Document';
    return `<h1>${title}</h1><p></p>`;
  }
  if (blocks.length === 1 && blocks[0].id === 'blk_main') {
    return blocks[0].content || `<h1>${defaultTitle || 'Untitled Document'}</h1><p></p>`;
  }
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading-1': return `<h1>${block.content}</h1>`;
        case 'heading-2': return `<h2>${block.content}</h2>`;
        case 'paragraph': return `<p>${block.content}</p>`;
        case 'callout': return `<blockquote>${block.content}</blockquote>`;
        case 'code': return `<pre><code>${block.content}</code></pre>`;
        default: return `<p>${block.content}</p>`;
      }
    })
    .join('');
}
