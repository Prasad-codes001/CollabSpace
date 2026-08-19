import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

// Gives every top-level block (paragraph, heading, blockquote, code block) a
// stable id, persisted into the HTML as a `data-block-id` attribute. This lets
// collaborators agree on which "section" of the document is locked/being edited.
function generateBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const BlockId = Extension.create({
  name: 'blockId',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote', 'codeBlock'],
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-block-id') || null,
            renderHTML: (attributes) => {
              const blockId = (attributes as any).blockId;
              return blockId ? { 'data-block-id': blockId } : {};
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockId'),
        appendTransaction(_transactions, _oldState, newState) {
          let tr: Transaction | null = null;
          const seen = new Set<string>();
          newState.doc.forEach((node: ProseMirrorNode, offset: number) => {
            const id = node.attrs.blockId as string | null;
            // ProseMirror's splitBlock copies the parent block's attrs to the
            // newly created block, so pressing Enter produces paragraphs that
            // SHARE one blockId. Duplicated [data-block-id] attributes make
            // querySelector() ambiguous (it returns the first match), which
            // breaks block-lock and cursor resolution. Regenerate any missing
            // OR duplicated id so every block gets a unique, stable id.
            if (!id || seen.has(id)) {
              if (!tr) tr = newState.tr;
              const freshId = generateBlockId();
              tr.setNodeMarkup(offset, null, { ...node.attrs, blockId: freshId });
              seen.add(freshId);
            } else {
              seen.add(id);
            }
          });
          return tr;
        },
      }),
    ];
  },
});
