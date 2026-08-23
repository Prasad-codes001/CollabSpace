# CollabSpace

CollabSpace is a full-stack collaborative document workspace for creating, organizing, editing, and sharing documents. It combines a React editor and workspace dashboard with an Express REST API, MongoDB persistence, and Socket.IO collaboration features. Authenticated users can work with private documents, shared documents, and workspaces with role-based access.

## Key Features

- Email/password signup and login with JWT sessions
- Rich-text document editing with TipTap
- Document creation, renaming, starring, trash, restore, and permanent deletion
- Markdown, PDF, and DOCX document uploads with stored file URLs and text extraction
- Document sharing with `OWNER`, `EDITOR`, and `VIEWER` roles
- Public document access controlled by organization settings when configured
- Real-time document content, title, presence, cursor, and block-lock updates
- Online collaborator indicators and read-only editor mode for viewers
- Per-document chat with MongoDB-backed history
- Manual document version creation, history listing, and version preview
- HTML and Markdown export endpoints, plus browser print and download UI
- Workspaces, workspace members, invitations, and workspace document lists
- Activity logging for document, permission, workspace, edit, delete, and export actions
- Avatar uploads and responsive dashboard/editor UI

The public landing-page previews are UI demonstrations. They do not represent separate backend functionality.

## Architecture

```text
React + TypeScript + Vite frontend
              |
       REST API + Socket.IO
              |
Node.js + Express + TypeScript backend
              |
       MongoDB Atlas via Mongoose
```

- **Frontend:** Provides the landing page, authentication flow, dashboard, workspace views, TipTap editor, sharing controls, chat, version history, and export actions. It calls the backend with `fetch` and stores the JWT in browser `localStorage`.
- **REST API:** Handles authentication, CRUD operations, permissions, uploads, versions, activities, invitations, and chat history.
- **Socket.IO:** Runs on the same HTTP server as Express for authenticated, document-room collaboration events.
- **Backend:** Validates requests with Zod, applies authorization rules, persists domain data, serves local uploads when needed, and coordinates Socket.IO state.
- **MongoDB Atlas:** Stores users, documents, document versions, workspaces, invitations, activities, chat messages, and organization settings.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| React 19 | Frontend UI |
| TypeScript | Static typing across frontend and backend |
| Vite | Frontend development server and build tool |
| Tailwind CSS v4 | Utility-first styling via the Vite plugin |
| Lucide React | Interface icons |
| TipTap 3 | Rich-text editor and formatting extensions |
| Node.js 20+ | Backend runtime |
| Express 5 | REST API server |
| Socket.IO 4 | Real-time collaboration and chat delivery |
| MongoDB Atlas + Mongoose 8 | Database and object modeling |
| JWT + bcryptjs | Stateless authentication and password hashing |
| Zod | Request validation |
| Multer | In-memory multipart upload handling |
| Cloudinary | Optional avatar/document file storage |
| pdf-parse | PDF text extraction |
| docx | Backend dependency for DOCX-related functionality |
| Helmet + CORS | HTTP security headers and cross-origin configuration |

## Project Structure

```text
backend/
  src/
    config/        Environment, database, and Cloudinary configuration
    controllers/   HTTP request handlers
    middleware/    JWT authentication, uploads, and error handling
    models/        Mongoose models
    routes/        Versioned REST route definitions
    services/      Authentication, documents, workspaces, uploads, extraction
    socket/        Socket.IO authentication, rooms, presence, locks, and chat
    validators/    Zod request schemas
    utils/         JWT, async handler, and API error helpers
frontend/
  src/
    api/            Fetch client and API contract types
    components/     Landing, auth, dashboard, editor, UI, and workspace views
    context/        Authentication context and session restoration
    services/       REST-backed frontend service adapters
    types/          Frontend domain types
    utils/          Document HTML/block conversion helpers
```

## Real-Time Collaboration

The backend attaches Socket.IO to the same HTTP server as Express. A client authenticates with its JWT, joins `doc:<documentId>`, and is checked against the document role before joining.

- **Document synchronization:** Editors broadcast TipTap HTML through `document:content-update`. Other clients apply updates, and the server debounces the latest HTML into MongoDB after three seconds.
- **Presence:** Join, leave, disconnect, and presence events maintain an in-memory list of users currently connected to a document.
- **Cursors:** `document:cursor-update` broadcasts cursor coordinates and block information to other clients.
- **Block locks:** Editors can acquire and release short-lived block locks. Locks expire after five minutes and are also released when a socket leaves.
- **Chat:** `chat:send` validates and persists messages, then broadcasts `chat:received`; REST loads the latest 100 messages.

This implementation uses block locks and event broadcasts. It does **not** implement CRDT or OT conflict resolution.

## Authentication & Authorization

- `POST /auth/signup` validates name, email, and a 6–128 character password. Passwords are hashed with bcryptjs before storage.
- `POST /auth/login` verifies the password and returns a JWT. Suspended users cannot log in or use protected routes.
- Protected REST routes require `Authorization: Bearer <token>`. Socket.IO accepts the token in the handshake auth or authorization header.
- The frontend persists the token and cached user profile in `localStorage`; logout removes them. JWT logout is stateless and does not revoke an already-issued token server-side.
- Documents use `OWNER`, `EDITOR`, and `VIEWER` roles. Owners manage collaborators and document access; editors can edit; viewers receive read-only access.
- Workspaces also store `OWNER`, `EDITOR`, and `VIEWER` member roles. The current service restricts invitations, member removal, and workspace deletion to the workspace owner.

## Database Models

| Model | Purpose |
| --- | --- |
| `User` | Identity, hashed password, role, status, avatar, and activity timestamps |
| `Document` | Document metadata, TipTap/block content, owner, workspace, collaborators, stars, trash state, and file URL |
| `DocumentVersion` | Manual snapshots of document title/content and editor |
| `Workspace` | Workspace metadata, owner, and member roles |
| `Invitation` | Pending/accepted/rejected/expired workspace invitations with seven-day expiry |
| `Activity` | User-visible audit-style activity records |
| `ChatMessage` | Per-document chat messages |
| `OrgSettings` | Public-link, 2FA, SSO, and session-timeout settings; only public-link reads are currently used by application routes |

## REST API

All route groups below are prefixed with `/api/v1`. All groups except the health check and signup/login require a bearer token.

| Route group | Implemented operations |
| --- | --- |
| `/health` | `GET` health status |
| `/auth` | `POST /signup`, `POST /login`, `POST /logout`, `GET /me` |
| `/documents` | Create/list/get/update, trash/restore/permanent delete, star, join by link, collaborator add/update/remove, access update, version create/list/get, export |
| `/documents/:id/chat` | `GET` the latest 100 chat messages |
| `/workspaces` | Create/list/get, list members, remove member, create invitation, delete workspace |
| `/invitations` | List current-user invitations, accept, reject |
| `/activities` | List activities, with optional `type` and `targetId` filters |
| `/upload` | `POST /avatar` and `POST /document` multipart uploads |

Document export formats currently accepted by the backend are `html`, `markdown`, and `pdf` (the PDF response is HTML content). Uploads accept PDF, DOCX, and Markdown files; avatars accept JPEG, PNG, WebP, and GIF.

## Environment Variables

Create `backend/.env` from `backend/.env.example` and `frontend/.env` from `frontend/.env.example`. Never commit real values.

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Server port, default `8000` |
| `NODE_ENV` | No | `development`, `production`, or `test` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | No | JWT lifetime, default `7d` |
| `CORS_ORIGIN` | No | Allowed frontend origin, default `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | No* | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No* | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No* | Cloudinary API secret |

\*Provide all three Cloudinary variables to use Cloudinary. Otherwise files are written beneath the backend `uploads/` directory and served at `/uploads/*`.

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No | Backend API base URL, default `/api/v1`; local example uses `http://localhost:8000/api/v1` |

## Local Development Setup

Requirements: Node.js 20 or newer and a reachable MongoDB deployment. Use two terminals.

```bash
git clone https://github.com/Prasad-codes001/CollabSpace.git
cd CollabSpace

cd backend
npm install
# create backend/.env from backend/.env.example and set MONGODB_URI and JWT_SECRET
npm run dev
```

In a second terminal:

```bash
cd CollabSpace/frontend
npm install
# create frontend/.env from frontend/.env.example if the API is not proxied
npm run dev
```

The backend runs on `http://localhost:8000` and exposes its health check at `http://localhost:8000/api/v1/health`. Vite normally serves the frontend at `http://localhost:5173`.

Useful commands:

```bash
# backend
npm run typecheck
npm run build
npm start

# frontend
npm run build
npm run lint
npm run preview
```

## Production / Deployment

Build the backend with `npm run build` and run `npm start`, which starts the compiled server from `dist/server.js`. Configure `MONGODB_URI`, a strong `JWT_SECRET`, `CORS_ORIGIN` matching the deployed frontend origin, and the production `PORT`. Set all Cloudinary variables when persistent managed file storage is required.

The frontend can be built with `npm run build` and deployed as a Vite static site. `frontend/vercel.json` rewrites all paths to `index.html` for SPA fallback. Set `VITE_API_BASE_URL` to the deployed backend API base URL and configure backend CORS to allow that frontend origin. Socket.IO must be reachable at the corresponding backend origin.

## Testing

No automated test files or test script are currently present in the repository. The available verification commands are the backend typecheck/build and frontend build/lint commands listed above.

## Known Limitations

- There is no automated test suite, seed data, or database migration workflow.
- Synchronization is event-based with block locks, not CRDT/OT; simultaneous edits can still require conflict handling.
- Presence and lock state are held in process memory, so multi-instance deployment would require a shared Socket.IO adapter/state store.
- JWT logout is client-side cleanup only; issued tokens remain valid until expiry.
- Workspace invitation delivery is not implemented as email delivery. Existing users are added directly; unknown users receive a stored invitation record.
- No admin dashboard or admin REST endpoints are implemented. `ADMIN` exists on the user model, but there is no current admin workflow.
- Organization settings have a model but no management API. Public-link behavior depends on the stored `allowPublicLinks` value.
- PDF export currently uses browser printing in the UI, while the backend `pdf` export returns HTML content rather than a generated PDF.
- DOCX export currently downloads Markdown-derived content with a DOCX MIME type; it is not a full DOCX conversion.
- PDF/DOCX extraction and Markdown handling are basic. Rich formatting and complex document structures are not preserved reliably.
- Without Cloudinary, local uploaded files are stored on the server filesystem, which is unsuitable for ephemeral production hosts.

## Future Improvements

- Add integration and end-to-end tests for authorization, collaboration, uploads, and exports.
- Introduce CRDT/OT-based content conflict resolution and a shared Socket.IO adapter for horizontal scaling.
- Add real email invitation delivery and invitation links for workspace members.
- Implement admin settings/routes, including organization settings management and user administration.
- Generate valid PDF and DOCX files server-side and improve import/export fidelity.
- Add refresh-token or server-side token revocation support and formal database migrations/seeding.

## Screenshots

### Dashboard

<!-- Add screenshot here -->

### Collaborative Editor

<!-- Add screenshot here -->

### Document Chat

<!-- Add screenshot here -->

## License

No license file is currently included in the repository. No open-source license is asserted here.