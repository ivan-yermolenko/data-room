# Acme Data Room — Virtual Document Repository MVP

A single-page application for securely organizing and managing documents in virtual Data Rooms, built as a take-home project for Acme Corp.

**Live Demo:** https://data-room-lime.vercel.app/

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Production build
npm run build
```

The app runs at `http://localhost:3000` (as configured in Vite).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 with CSS custom properties design system |
| State Management | Zustand (slice pattern) |
| Persistence | IndexedDB (native API, no libraries) |
| Icons | Lucide React |
| Utilities | clsx + tailwind-merge |

---

## Features

### Core CRUD

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| **Data Rooms** | ✅ New room via sidebar | ✅ Room list in sidebar | — | ✅ With all contained nodes |
| **Folders** | ✅ Nested folder creation | ✅ Grid view + breadcrumb navigation | ✅ Rename | ✅ Recursive deletion |
| **Files** | ✅ PDF upload (picker + drag-and-drop) | ✅ In-app PDF preview (iframe) + download | ✅ Rename | ✅ With confirmation |

### Beyond CRUD

- **Search** — Debounced (300ms) global search across all nodes in the active room
- **Filtering** — Toggle between All / Folders / Files views
- **Sorting** — 6 sort options: name (A-Z, Z-A), date (newest, oldest), size (largest, smallest)
- **Drag-and-Drop** — Drag files from desktop to upload; drag nodes onto folders to move them
- **Move Modal** — Visual folder tree picker with indentation and safety restrictions
- **Mobile Responsive** — Collapsible sidebar, single-tap navigation, optimized touch targets
- **Mock Authentication** — Name/email login persisted to localStorage

---

## Design Decisions

### Data Model: Flat List with `parentId` References

Instead of a deeply nested tree structure, nodes are stored as a **flat array** with `parentId` pointers:

```typescript
interface DataNode {
  id: string;
  roomId: string;
  parentId: string | null;  // null = root level
  type: NodeType;           // 'folder' | 'file'
  name: string;
  createdAt: number;
  updatedAt: number;
  size?: number;
  mimeType?: string;
  fileData?: Blob;
}
```

**Why this approach:**
- **Simple queries** — filtering children is just `nodes.filter(n => n.parentId === folderId)`
- **Efficient operations** — moving a node is a single `parentId` update, not a subtree splice
- **IndexedDB-friendly** — flat records map naturally to object stores; a `roomId` index enables efficient per-room loading
- **Scalable** — mirrors how real databases (SQL/NoSQL) store hierarchical data

### State Management: Zustand with Slice Pattern

State is split into focused slices (`roomsSlice`, `nodesSlice`) composed in a single store:

```
useDataroomStore = roomsSlice + nodesSlice + { loading, error, initStore }
```

**Why Zustand over Redux/Context:**
- Zero boilerplate — no providers, reducers, or action creators
- Slice pattern gives the modularity of Redux without the ceremony
- Direct async operations in slice actions (no middleware needed)
- Subscriptions are selector-based, so components only re-render on relevant state changes

### Persistence: Raw IndexedDB (No Library)

The `DataroomDB` service wraps IndexedDB directly without ORMs like Dexie or idb:

**Why no library:**
- Full control over transactions (crucial for atomic room deletion where we delete a room + all its nodes in one transaction)
- No extra dependencies — the entire DB layer is ~160 lines
- Singleton pattern with idempotent `init()` and promise deduplication prevents race conditions

**Schema:**
- `rooms` store — keyed by `id`
- `nodes` store — keyed by `id`, indexed on `roomId` for efficient per-room lookups

### Duplicate Name Resolution

The `resolveUniqueName` function handles name collisions automatically:

- Case-insensitive comparison among siblings of the same type
- Appends ` (1)`, ` (2)`, etc., for conflicts
- Preserves file extensions: `report.pdf` → `report (1).pdf`
- Applied consistently across create, rename, upload, and move operations

### Recursive Deletion

When deleting a folder, the DB layer collects all descendant IDs via BFS in a single read, then deletes them all within the same `readwrite` transaction. This ensures atomicity — either everything is deleted or nothing is.

### Move Safety

Moving nodes includes two safety checks:
1. **Self-reference** — cannot move a node into itself
2. **Circular reference** — `isDescendant()` walks the parent chain (with cycle protection via `visited` Set) to prevent moving a folder into its own subtree

### Component Architecture

```
App.tsx (orchestrator — modal state, event handlers)
└── WorkspaceLayout
    ├── Sidebar (room list, "New" dropdown)
    ├── Header (search, auth)
    ├── Breadcrumbs (folder path navigation)
    └── NodeGrid (content area)
        ├── NodeFilters (filter/sort toolbar)
        ├── NodeCard[] (individual items, drag-and-drop)
        ├── NodeContextMenu (right-click actions)
        └── Modals (CreateFolder, Rename, Move, PdfPreview, Confirm)
```

**Principles:**
- `App.tsx` acts as the single orchestrator — it owns modal state and event handlers, keeping child components pure and reusable
- UI primitives (`Modal`, `ConfirmModal`) are separated from business components
- Context menu is positioned dynamically with viewport boundary clamping

### Error Handling Strategy

- All async operations are wrapped in try/catch with a global `error` state
- Errors are displayed as a dismissible banner in the UI
- A mock `sentryService` captures exceptions with structured context metadata — ready to swap for real Sentry SDK in production
- Non-PDF upload attempts show a temporary error that auto-clears after 5 seconds

---

## Project Structure

```
src/
├── App.tsx                          # Main orchestrator
├── main.tsx                         # React entry point
├── index.css                        # Tailwind + design tokens (light/dark)
├── types/
│   └── dataroom.ts                  # Core types (DataNode, Dataroom, NodeType)
├── store/
│   ├── useDataroomStore.ts          # Zustand store (composed slices)
│   ├── nodesSlice.ts                # Folder/file CRUD actions
│   ├── roomsSlice.ts                # Data room CRUD actions
│   └── useAuthStore.ts              # Mock auth (localStorage)
├── services/
│   ├── db.ts                        # IndexedDB wrapper (DataroomDB)
│   └── sentry.ts                    # Error tracking mock
├── utils/
│   ├── uuid.ts                      # crypto.randomUUID with fallback
│   └── nodeSorting.ts               # Pure sort with comparator dictionary
├── hooks/
│   ├── useDebounce.ts               # Generic debounce hook
│   └── useIsMobile.ts               # Responsive breakpoint (matchMedia)
└── components/
    ├── ui/
    │   ├── Modal.tsx                # Reusable <dialog>-based modal
    │   └── ConfirmModal.tsx         # Destructive action confirmation
    └── features/
        ├── layout/
        │   ├── Header.tsx           # Search + auth UI
        │   ├── Sidebar.tsx          # Room list + "New" dropdown
        │   └── WorkspaceLayout.tsx  # Shell layout + mobile sidebar
        └── nodes/
            ├── Breadcrumbs.tsx      # Folder path navigation
            ├── NodeCard.tsx         # Node card (drag-and-drop)
            ├── NodeContextMenu.tsx  # Right-click menu
            ├── NodeFilters.tsx      # Filter + sort controls
            ├── NodeGrid.tsx         # Main grid + empty/search states
            └── modals/
                ├── CreateFolderModal.tsx
                ├── RenameModal.tsx
                ├── MoveNodeModal.tsx
                └── PdfPreviewModal.tsx
```

---

## Edge Cases Handled

| Scenario | Behavior |
|---|---|
| Upload file with duplicate name | Auto-renamed to `file (1).pdf`, `file (2).pdf`, etc. |
| Create folder with existing name | Same deduplication logic, case-insensitive |
| Drag non-PDF file | Rejected with temporary error message |
| Delete folder you're currently inside | Navigates to parent folder |
| Delete the last data room | Auto-creates a default room |
| Move folder into its own subfolder | Prevented with `isDescendant` check |
| Corrupt parent chain in breadcrumbs | `visited` Set guards against infinite loops |
| Large file upload | Stored as Blob in IndexedDB (browser quota applies) |
| Rapid double-click on submit | `isSubmitting` flag disables button during async operation |

---

## What I Would Add With More Time

- **Real authentication** — Google OAuth via `@react-oauth/google` (already in dependencies)
- **Backend + Blob storage** — Vercel Functions + Vercel Blob / Supabase for persistent file storage
- **Rename data rooms** — Currently only create/delete is supported
- **Batch operations** — Multi-select files/folders for bulk delete/move
- **File type expansion** — Support for images, Word docs, etc., with type-specific previews
- **Activity log** — Track who uploaded/modified documents and when
