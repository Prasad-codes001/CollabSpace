import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { Socket } from 'socket.io-client';

interface CollaborationOverlayProps {
  editor: Editor | null;
  docId: string;
  socket: Socket | null;
  currentUserId: string;
}

interface ActiveCursor {
  id: string;
  name: string;
  color: string;
  // Preferred: the block the collaborator is editing, resolved locally so the
  // caret always lands on the same block the lock indicator marks.
  blockId: string | null;
  blockIndex: number;
  relTop: number;
  relLeft: number;
  // Absolute ProseMirror doc position fallback, resolved via coordsAtPos.
  pos: number;
  // Fallback: raw pixel coords transmitted by the sender (used only when the
  // block cannot be found locally, e.g. before block ids converge).
  top: number;
  left: number;
  height: number;
  lastUpdated: number;
}

interface CursorPos {
  top: number;
  left: number;
  height: number;
}

export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({
  editor,
  docId: _docId,
  socket,
  currentUserId,
}) => {
  const [activeCursors, setActiveCursors] = useState<ActiveCursor[]>([]);
  const [positions, setPositions] = useState<Record<string, CursorPos>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editor || !socket) return;

    const handleCursorUpdated = (data: { userId: string; name: string; color: string; cursor: any }) => {
      if (data.userId === currentUserId) return;
      const c = data.cursor || {};
      setActiveCursors(prev => {
        const filtered = prev.filter(cur => cur.id !== data.userId);
        return [
          ...filtered,
          {
            id: data.userId,
            name: data.name,
            color: data.color,
            blockId: c.blockId || null,
            blockIndex: typeof c.blockIndex === 'number' ? c.blockIndex : -1,
            relTop: typeof c.relTop === 'number' ? c.relTop : 0,
            relLeft: typeof c.relLeft === 'number' ? c.relLeft : 0,
            pos: typeof c.pos === 'number' ? c.pos : -1,
            top: c.top || 0,
            left: c.left || 0,
            height: c.height || 18,
            lastUpdated: Date.now(),
          },
        ];
      });
    };

    const handleUserLeft = (data: { userId: string }) => {
      setActiveCursors(prev => prev.filter(c => c.id !== data.userId));
    };

    socket.on('document:cursor-updated', handleCursorUpdated);
    socket.on('document:user-left', handleUserLeft);

    const cleanupInterval = setInterval(() => {
      setActiveCursors(prev => prev.filter(c => Date.now() - c.lastUpdated < 5000));
    }, 1000);

    return () => {
      socket.off('document:cursor-updated', handleCursorUpdated);
      socket.off('document:user-left', handleUserLeft);
      clearInterval(cleanupInterval);
    };
  }, [editor, socket, currentUserId]);

  // Resolve each remote caret's pixel position from the receiver's own editor
  // DOM (the same coordinate space the lock overlay uses), so the caret always
  // appears on the actual block the collaborator is editing.
  useEffect(() => {
    if (!editor || activeCursors.length === 0) return;

    const compute = () => {
      const viewDom = editor.view.dom as HTMLElement;
      const container = containerRef.current;
      const base = (container || viewDom).getBoundingClientRect();
      const next: Record<string, CursorPos> = {};

      for (const cursor of activeCursors) {
        let el: HTMLElement | null = null;
        if (cursor.blockId) {
          el = viewDom.querySelector<HTMLElement>(`[data-block-id="${cursor.blockId}"]`);
        }
        if (!el && cursor.blockIndex >= 0) {
          const block = viewDom.children[cursor.blockIndex] as HTMLElement | undefined;
          el = block || null;
        }

        if (el) {
          const r = el.getBoundingClientRect();
          next[cursor.id] = {
            top: r.top - base.top + cursor.relTop,
            left: r.left - base.left + cursor.relLeft,
            height: Math.max(cursor.height, 2),
          };
        } else if (cursor.pos >= 0) {
          // Block not found locally — resolve the remote ProseMirror position
          // against OUR document so the caret lands in the right spot even when
          // ids/indexes drift momentarily.
          try {
            const coords = editor.view.coordsAtPos(cursor.pos);
            next[cursor.id] = {
              top: coords.top - base.top,
              left: coords.left - base.left,
              height: Math.max(cursor.height, 2),
            };
          } catch {
            // Fall back to the sender's raw pixels.
            next[cursor.id] = {
              top: cursor.top,
              left: cursor.left,
              height: Math.max(cursor.height, 2),
            };
          }
        } else {
          // No usable anchor — fall back to the sender's raw pixels.
          next[cursor.id] = {
            top: cursor.top,
            left: cursor.left,
            height: Math.max(cursor.height, 2),
          };
        }
      }

      setPositions(next);
    };

    compute();
    window.addEventListener('resize', compute);
    document.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      document.removeEventListener('scroll', compute, true);
    };
  }, [editor, activeCursors]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {activeCursors.map(cursor => {
        const pos = positions[cursor.id];
        if (!pos) return null;
        return (
          <div
            key={cursor.id}
            className="absolute w-[2px] transition-all duration-100 ease-out"
            style={{
              top: pos.top,
              left: pos.left,
              height: pos.height,
              backgroundColor: cursor.color,
            }}
          >
            <div
              className="absolute -top-4 left-0 px-1.5 py-0.5 rounded text-[8px] font-bold text-white whitespace-nowrap shadow-sm animate-in fade-in"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};