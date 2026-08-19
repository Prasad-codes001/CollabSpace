import React, { useEffect, useState, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Lock } from 'lucide-react';

export interface LockInfo {
  userId: string;
  name: string;
  color: string;
  // Ordinal of the top-level block being edited, sent by the locking user so we
  // can locate the same block even when random block ids don't match locally.
  blockIndex?: number;
  // Absolute ProseMirror doc position fallback (unused for block rects; kept for
  // parity with the cursor payload).
  pos?: number;
}

interface LockOverlayProps {
  editor: Editor | null;
  locks: Record<string, LockInfo>;
  currentUserId: string;
}

interface LockRect extends LockInfo {
  blockId: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

// Renders a highlighted rectangle over each block that another collaborator is
// currently editing. The rectangle intercepts mouse input so the user cannot
// click into the locked section.
export const LockOverlay: React.FC<LockOverlayProps> = ({ editor, locks, currentUserId }) => {
  const [rects, setRects] = useState<LockRect[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editor) return;

    const compute = () => {
      const viewDom = editor.view.dom as HTMLElement;
      // Measure against the overlay's own container (the editor card origin) so
      // the rectangle aligns exactly with the block, including the editor's
      // padding — matching the coordinate space of the remote cursor overlay.
      const container = containerRef.current;
      const base = (container || viewDom).getBoundingClientRect();
      const found: LockRect[] = [];

      for (const [blockId, lock] of Object.entries(locks)) {
        if (lock.userId === currentUserId) continue;
        // Resolve the remote block against OUR own editor DOM: prefer the exact
        // block id, then fall back to the block's ordinal index (block ids are
        // random per client and only converge for non-active blocks, so the
        // index is the reliable anchor). This keeps the lock indicator on the
        // same paragraph the collaborator is actually typing in.
        let el: HTMLElement | null = viewDom.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
        if (!el && typeof lock.blockIndex === 'number' && lock.blockIndex >= 0) {
          el = (viewDom.children[lock.blockIndex] as HTMLElement) || null;
        }
        if (!el) continue;
        const r = el.getBoundingClientRect();
        found.push({
          blockId,
          userId: lock.userId,
          name: lock.name,
          color: lock.color,
          top: r.top - base.top,
          left: r.left - base.left,
          width: r.width,
          height: r.height,
        });
      }
      setRects(found);
    };

    compute();
    // Re-resolve whenever the editor content changes too — remote content
    // adoption reassigns block ids/elements, so a lock computed once against a
    // stale DOM would sit on the wrong block.
    const onTransaction = () => compute();
    editor.on('transaction', onTransaction);
    window.addEventListener('resize', compute);
    document.addEventListener('scroll', compute, true);
    return () => {
      editor.off('transaction', onTransaction);
      window.removeEventListener('resize', compute);
      document.removeEventListener('scroll', compute, true);
    };
  }, [editor, locks, currentUserId]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {rects.map((r) => (
        <div
          key={r.blockId}
          className="absolute pointer-events-auto rounded-lg animate-in fade-in duration-200"
          style={{
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            border: `2px dashed ${r.color}`,
            backgroundColor: `${r.color}14`,
          }}
        >
          <div
            className="absolute -top-7 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm whitespace-nowrap"
            style={{ backgroundColor: r.color }}
          >
            <Lock className="w-3 h-3" />
            {r.name} is editing this block
          </div>
        </div>
      ))}
    </div>
  );
};
