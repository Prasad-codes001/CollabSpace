# CollabSpace — Session Context

## Project
- Full-stack collaborative document workspace: `frontend/` (React 18 + Vite + TS + Tailwind v4) + `backend/` (Express 5 + TypeScript + Mongoose + Socket.IO).
- Backend scripts: `npm run dev` (tsx watch src/server.ts), `npm run build` (tsc → dist/), `npm start` (node dist/server.js), `npm run typecheck`.
- Frontend dev server: http://localhost:5173, backend: port 8000, API base `/api/v1`.
- Note: backend can run from `dist/` (`npm start`) — always run `npm run build` after editing `src/`.
- Frontend: TipTap **v3** (`setContent(html, { emitUpdate: false })` uses an options object, NOT a boolean). No react-router — App.tsx is state-based; invite URLs `/d/:id` and `/invite/:id` are parsed manually.

## Issue 1 (FIXED): Documents leaking across accounts
- Symptom: a document created in one account (e.g. "Prasad1") was also visible in another account (Yeole).
- Root cause: `backend/src/services/document.service.ts` `getDocuments()` returned docs where the user is `owner OR collaborator` (`{ $or: [{ owner }, { 'collaborators.user' }] }`). Docs where a user was merely an EDITOR/VIEWER collaborator also showed in that user's main "My Documents"/Home list (frontend always calls `filter=all`).
- Fix: changed `accessible` to owner-only `{ owner: userId }` for all buckets (`all`, `trash`, `starred`, `workspace`). The explicit `filter=shared` bucket still returns collaborator docs (kept intentionally). Rebuilt `dist/` with `npm run build`.
- Consequence: "Shared With Me" tab is now empty by design. Re-enable via `filter=shared` if requested later.
- Restart backend after pulling this change (a stale `dist/` may still run the old code).

## Issue 2 (FIXED, urgent fix pass): Real-time sync, persistence, invite/shared-with-me
### Real-time sync root cause
- `frontend/src/components/editor/BlockId.ts` generates **random** block ids per editor instance (`blk_${Date.now()}_${random}`). The old `applyRemoteContent` matched remote blocks **by blockId**, so when A and B had different ids the diff removed+re-added everything → scrambled/duplicated/stale content, updates not applying.
- Fix (`DocumentEditor.tsx` `applyRemoteContent`): id-agnostic merge — same top-level block count → replace blocks **positionally** (skipping the locally active block, adopting sender ids so ids converge); different count → adopt remote doc wholesale via `setContent(html, { emitUpdate: false })` guarded by `isRemoteUpdate`. Sender never echoes (backend uses `socket.to`, frontend also skips own userId).
### Persistence root cause
- Race: initial REST `getDocumentById` response could overwrite fresher socket content applied during load.
- Fix: `appliedRemoteRef` flag — REST `setContent` is skipped if a remote socket update already applied. Both savers already write the same canonical `blk_main` format (`htmlToBlocks` + socket save), so no format conflict.
### Invite / Shared With Me root cause
- After owner-only fix the Shared tab was empty (frontend derived it from `filter=all`); the copied link `/d/:id` had no router and granted no access.
- Fix: UserDashboard loads `documentService.getSharedDocuments()` (`filter=shared`) and uses it for the Shared tab + stats. Added backend `POST /api/v1/documents/:id/join` (`documentService.joinByLink`) that adds the authed user as a VIEWER collaborator (idempotent, reuses collaborators array). `App.tsx` parses `/d/:id` & `/invite/:id`, stores pending doc in localStorage (`collabspace_pending_doc`), and after auth runs join → getDocumentById → opens editor. Role enforced server-side (EDITOR can save, VIEWER gets 403; socket also blocks VIEWER).
- Restart backend after this change; rebuilt `dist/`.

## Verified DB (MongoDB Atlas) — real users
- Prasad = `6a67487d095cd81e63b1d639` (xyz@gmail.com); Yeole = `6a674e0d095cd81e63b1d6f3` (xyz1@gmail.com).
- After fix, Yeole sees own docs "Prasad1" (`6a674f30...`) and "Hello"; Prasad sees only his own docs.

## E2E test (14/14 passed, run against local server + Atlas)
- A creates doc; A invites B as EDITOR; B sees it in Shared With Me; B can save; C joins via link (VIEWER), sees it shared, save blocked (403); real-time A→B and B→A immediate, no self-echo, no duplication; content persists after reload.

## Key files
- Backend document logic: `backend/src/services/document.service.ts` (getDocuments owner-only, joinByLink), `backend/src/controllers/document.controller.ts`, routes `backend/src/routes/document.routes.ts`, model `backend/src/models/Document.ts`.
- Socket: `backend/src/socket/index.ts` — `doc:${documentId}` room, `document:content-update`→broadcast `document:content-updated`, debounced 3s save to `blk_main` format.
- Frontend: `frontend/src/components/editor/DocumentEditor.tsx` (applyRemoteContent, appliedRemoteRef, socket listeners), `frontend/src/components/dashboard/UserDashboard.tsx` (sharedDocs), `frontend/src/App.tsx` (invite link parse/open), `frontend/src/services/documentService.ts`.

## User's request
- Strict per-user document isolation for the owner list; shared docs live under "Shared With Me". Fixes must not break auth, CRUD, permissions, presence, chat, versions, workspaces, admin, uploads, exports.
