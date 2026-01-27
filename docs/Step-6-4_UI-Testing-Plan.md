---
name: Step 6.4 UI Testing Plan
overview: A comprehensive browser-based UI testing plan for Step 6.4 using the cursor-browser-extension MCP, covering all UI polish features that were not verified in previous server/build testing.
todos:
  - id: a1-setup
    content: "A1: Start dev server, navigate to app, verify load without console errors"
    status: pending
  - id: a2-keyboard
    content: "A2: Test KeyboardShortcutsModal - open with ?, verify sections, close with Escape"
    status: pending
  - id: a3-views
    content: "A3: Toggle between Tree and Kanban views using buttons and keyboard"
    status: pending
  - id: a4-toast
    content: "A4: Trigger action, verify toast notification appears with correct styling"
    status: pending
  - id: a5-kanban-dnd
    content: "A5: Kanban drag-and-drop - move card between columns, verify status update"
    status: pending
  - id: a6-tree-dnd
    content: "A6: Tree view drag-and-drop - move issue to new parent, verify hierarchy"
    status: pending
  - id: a7-issue-panel
    content: "A7: Issue interaction - open detail panel, edit field, verify save, close"
    status: pending
  - id: a8-empty-states
    content: "A8: Empty states - search for non-existent term, verify 'No results' message"
    status: pending
  - id: a9-selection
    content: "A9: Selection & Bulk - checkbox selection, shift+click range, BulkActionBar"
    status: pending
  - id: a10-error-boundary
    content: "A10: Error Boundary (optional) - verify friendly error UI if testable"
    status: pending
  - id: a11-screenshots
    content: "A11: Capture screenshots for key states (Tree, Kanban, Modal, Panel)"
    status: pending
  - id: b-manual
    content: "Phase B: Test START-HERE scripts and full distribution workflow"
    status: pending
isProject: false
---

# Step 6.4 Comprehensive UI Testing Plan

## Table of Contents

- [Context](#context)
- [Testing Strategy](#testing-strategy)
- [Pre-requisites](#pre-requisites)
- [Test Categories](#test-categories)
  - [1. App Initialization Tests](#1-app-initialization-tests)
  - [2. Keyboard Shortcuts Modal Tests](#2-keyboard-shortcuts-modal-tests)
  - [3. View Switching Tests](#3-view-switching-tests)
  - [4. Toast Notification Tests](#4-toast-notification-tests)
  - [5. Drag-and-Drop Tests](#5-drag-and-drop-tests)
    - [5a. Kanban Drag-and-Drop](#5a-kanban-drag-and-drop)
    - [5b. Tree View Drag-and-Drop](#5b-tree-view-drag-and-drop)
  - [6. Issue Interaction Tests](#6-issue-interaction-tests)
  - [7. Error Boundary Tests](#7-error-boundary-tests)
  - [8. Empty State Tests](#8-empty-state-tests)
  - [9. Selection & Bulk Actions Tests](#9-selection--bulk-actions-tests)
- [Manual Tests (Cannot Automate)](#manual-tests-cannot-automate)
- [Test Execution Approach](#test-execution-approach)
  - [Phase A: Automated Browser Tests](#phase-a-automated-browser-tests-using-cursor-browser-extension-mcp)
    - [A1. Setup & Initialization](#a1-setup--initialization-category-1)
    - [A2. Keyboard Shortcuts Modal](#a2-keyboard-shortcuts-modal-category-2)
    - [A3. View Switching](#a3-view-switching-category-3)
    - [A4. Toast Notifications](#a4-toast-notifications-category-4)
    - [A5. Kanban Drag-and-Drop](#a5-kanban-drag-and-drop-category-5a)
    - [A6. Tree View Drag-and-Drop](#a6-tree-view-drag-and-drop-category-5b)
    - [A7. Issue Interaction](#a7-issue-interaction-category-6)
    - [A8. Empty States](#a8-empty-states-category-8)
    - [A9. Selection & Bulk Actions](#a9-selection--bulk-actions-category-9)
    - [A10. Error Boundary](#a10-error-boundary-category-7---optional)
    - [A11. Capture Evidence](#a11-capture-evidence)
  - [Phase B: Manual Verification](#phase-b-manual-verification)
- [Success Criteria](#success-criteria)

---

## Context

Per [`docs/Step-6-4_testing-done.md`](docs/Step-6-4_testing-done.md), the following have been verified:
- Build pipeline (npm run build, npm run package)
- Production server (API endpoints, static file serving)
- Package distribution workflow (ZIP extraction, npm install, server start)

**Pending**: All UI/browser-based tests requiring actual rendering and interaction.

---

## Testing Strategy

Use the `cursor-browser-extension` MCP which provides:
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Get accessibility tree with element refs
- `browser_console_messages` - Check for JavaScript errors
- `browser_click` - Click elements
- `browser_press_key` - Press keyboard keys
- `browser_drag` - Drag-and-drop operations
- `browser_take_screenshot` - Visual verification

---

## Pre-requisites

1. Start the dev server: `npm run dev`
2. Server should be running on `http://localhost:5173` (Vite default)

---

## Test Categories

### 1. App Initialization Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 1.1 | App loads without errors | Navigate to `http://localhost:5173`, check console | No console errors, page renders |
| 1.2 | Loading spinner displays | Observe initial load | Loading spinner visible briefly before content |
| 1.3 | Data loads from API | Wait for initialization | Issues/projects visible in UI |

**Browser MCP Sequence**:
- `browser_navigate` to `http://localhost:5173`
- `browser_snapshot` to verify UI rendered
- `browser_console_messages` to check for errors

---

### 2. Keyboard Shortcuts Modal Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 2.1 | Modal opens with `?` key | Press `?` key | Modal appears with "Keyboard Shortcuts" title |
| 2.2 | Modal shows all shortcut sections | Inspect modal content | 5 sections: Navigation, Issue Actions, Selection, Search & Views, Help |
| 2.3 | Modal closes with Escape | Press `Escape` | Modal closes |
| 2.4 | Modal closes on backdrop click | Click outside modal | Modal closes |

**Browser MCP Sequence**:
- `browser_press_key` with `?`
- `browser_snapshot` to verify modal appeared
- `browser_press_key` with `Escape`
- `browser_snapshot` to verify modal closed

**Components Under Test**: [`src/components/UI/KeyboardShortcutsModal.tsx`](src/components/UI/KeyboardShortcutsModal.tsx)

---

### 3. View Switching Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 3.1 | Tree view displays by default | Load app | Tree view with hierarchical issues |
| 3.2 | Switch to Kanban with button | Click Kanban toggle | Kanban board with status columns |
| 3.3 | Switch to Tree with button | Click Tree toggle | Tree view restored |
| 3.4 | Switch views with keyboard | Press `1` then `2` | View switches accordingly |

**Browser MCP Sequence**:
- `browser_snapshot` to find view toggle buttons
- `browser_click` on Kanban button
- `browser_snapshot` to verify Kanban columns visible
- `browser_press_key` with `1` to switch to Tree

---

### 4. Toast Notification Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 4.1 | Toast appears on action | Create/edit/delete an issue | Toast notification appears in bottom-right |
| 4.2 | Toast has correct styling | Observe toast | Success=green, Error=red, Info=blue |
| 4.3 | Toast auto-dismisses | Wait 4-6 seconds | Toast disappears automatically |
| 4.4 | Toast can be manually dismissed | Click X button on toast | Toast closes immediately |

**Components Under Test**: 
- [`src/components/UI/ToastContainer.tsx`](src/components/UI/ToastContainer.tsx)
- [`src/components/UI/toastStore.ts`](src/components/UI/toastStore.ts)

**Browser MCP Sequence**:
- Trigger an action (e.g., create issue, change status)
- `browser_snapshot` to verify toast visible with role="alert"
- Wait or click dismiss button

---

### 5. Drag-and-Drop Tests

#### 5a. Kanban Drag-and-Drop

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 5a.1 | Drag card between columns | Drag card from "To Do" to "In Progress" | Card moves, status updates, toast confirms |
| 5a.2 | Card persists after drag | Refresh page | Card still in new column |

**Browser MCP Sequence**:
- `browser_snapshot` to find card and target column refs
- `browser_drag` with startRef (card) and endRef (column)
- `browser_snapshot` to verify card in new position
- `browser_console_messages` to check for errors

#### 5b. Tree View Drag-and-Drop

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 5b.1 | Drag issue to new parent | Drag a Story under a different Epic | Hierarchy updates |
| 5b.2 | Prevent invalid moves | Try dragging parent under its child | Move prevented (no circular reference) |

---

### 6. Issue Interaction Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 6.1 | Click issue opens detail panel | Click on any issue card | Slide-out panel appears from right |
| 6.2 | Edit inline title | Click title, type new text, blur | Title updates, toast confirms |
| 6.3 | Change status dropdown | Open dropdown, select new status | Status updates, card moves if in Kanban |
| 6.4 | Close panel with Escape | Press Escape | Panel closes |

**Browser MCP Sequence**:
- `browser_click` on issue card
- `browser_snapshot` to verify panel open
- `browser_fill_form` or `browser_click` to edit fields
- `browser_press_key` with `Escape` to close

---

### 7. Error Boundary Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 7.1 | Error boundary catches errors | Trigger component error (if possible) | Friendly error UI with "Something went wrong" |
| 7.2 | Try Again button works | Click "Try Again" | Component attempts re-render |
| 7.3 | Reload Page button works | Click "Reload Page" | Page reloads |

**Note**: Testing error boundaries may require intentionally breaking a component or using React DevTools.

**Components Under Test**: [`src/components/ErrorBoundary/ErrorBoundary.tsx`](src/components/ErrorBoundary/ErrorBoundary.tsx)

---

### 8. Empty State Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 8.1 | Empty search results | Search for non-existent term | "No results" message displayed |
| 8.2 | Empty filter results | Apply filters that match nothing | Empty state with helpful message |

---

### 9. Selection & Bulk Actions Tests

| ID | Test | Steps | Expected Result |
|----|------|-------|-----------------|
| 9.1 | Checkbox selection | Click checkbox on issue | Issue selected, BulkActionBar appears |
| 9.2 | Shift+click range | Select one, then Shift+click another | Range of issues selected |
| 9.3 | Bulk action bar | With issues selected | Shows "X issues selected" with action buttons |

---

## Manual Tests (Cannot Automate)

These require physical machine testing:

| Test | Platform | Steps |
|------|----------|-------|
| Double-click START-HERE.command | macOS | Double-click file, verify browser opens at localhost:3000 |
| Double-click START-HERE.bat | Windows | Double-click file, verify browser opens at localhost:3000 |
| Fresh install workflow | Any | Extract ZIP to new folder, double-click start script, verify app works |

---

## Test Execution Approach

### Phase A: Automated Browser Tests (Using cursor-browser-extension MCP)

#### A1. Setup & Initialization (Category 1)
- [ ] Start dev server (`npm run dev`)
- [ ] `browser_navigate` to `http://localhost:5173`
- [ ] `browser_snapshot` to verify UI rendered
- [ ] `browser_console_messages` to check for errors

#### A2. Keyboard Shortcuts Modal (Category 2)
- [ ] `browser_press_key` with `?` to open modal
- [ ] `browser_snapshot` to verify modal with 5 sections
- [ ] `browser_press_key` with `Escape` to close
- [ ] `browser_snapshot` to verify modal closed

#### A3. View Switching (Category 3)
- [ ] `browser_snapshot` to find view toggle buttons
- [ ] `browser_click` on Kanban button
- [ ] `browser_snapshot` to verify Kanban columns visible
- [ ] `browser_press_key` with `1` to switch back to Tree
- [ ] `browser_snapshot` to verify Tree view restored

#### A4. Toast Notifications (Category 4)
- [ ] Trigger action that shows toast (e.g., status change)
- [ ] `browser_snapshot` to verify toast with role="alert"
- [ ] Verify toast styling (success=green, error=red)
- [ ] Wait ~5s or click dismiss, verify toast removed

#### A5. Kanban Drag-and-Drop (Category 5a)
- [ ] Switch to Kanban view
- [ ] `browser_snapshot` to find card and target column refs
- [ ] `browser_drag` card from "To Do" to "In Progress"
- [ ] `browser_snapshot` to verify card in new column
- [ ] `browser_console_messages` to check for errors

#### A6. Tree View Drag-and-Drop (Category 5b)
- [ ] Switch to Tree view
- [ ] `browser_snapshot` to find issue refs
- [ ] `browser_drag` Story to different Epic parent
- [ ] `browser_snapshot` to verify hierarchy updated
- [ ] Verify circular reference prevention (optional)

#### A7. Issue Interaction (Category 6)
- [ ] `browser_click` on issue card to open detail panel
- [ ] `browser_snapshot` to verify panel open
- [ ] Edit a field (title or status)
- [ ] Verify toast confirms save
- [ ] `browser_press_key` with `Escape` to close panel

#### A8. Empty States (Category 8)
- [ ] Use search bar to search for non-existent term
- [ ] `browser_snapshot` to verify "No results" message
- [ ] Clear search

#### A9. Selection & Bulk Actions (Category 9)
- [ ] `browser_click` on issue checkbox to select
- [ ] `browser_snapshot` to verify BulkActionBar appears
- [ ] Shift+click another issue for range selection
- [ ] Verify "X issues selected" shows correct count
- [ ] Deselect all

#### A10. Error Boundary (Category 7) - Optional
- [ ] Note: Requires intentionally breaking a component or using React DevTools
- [ ] If testable: verify "Something went wrong" UI displays
- [ ] If testable: verify "Try Again" and "Reload Page" buttons work

#### A11. Capture Evidence
- [ ] `browser_take_screenshot` for key states (Tree, Kanban, Modal, Panel)

### Phase B: Manual Verification

- [ ] Test START-HERE.command on macOS (double-click opens browser)
- [ ] Test START-HERE.bat on Windows (if available)
- [ ] Full distribution workflow: extract ZIP → double-click → verify app works
- [ ] Exploratory testing for edge cases

---

## Success Criteria

Step 6.4 is complete when all test categories pass:

| Category | Criteria |
|----------|----------|
| 1. Initialization | App loads with no console errors, data displays |
| 2. Keyboard Shortcuts | Modal opens with `?`, shows all sections, closes with Escape |
| 3. View Switching | Tree ↔ Kanban toggle works via button and keyboard |
| 4. Toast Notifications | Toasts appear on actions, correct styling, auto-dismiss |
| 5a. Kanban DnD | Cards drag between columns, status updates persist |
| 5b. Tree DnD | Issues drag to new parents, hierarchy updates |
| 6. Issue Interaction | Detail panel opens, fields editable, saves work |
| 7. Error Boundary | Friendly error UI displays on component errors (if testable) |
| 8. Empty States | "No results" message shows for empty search/filter |
| 9. Selection/Bulk | Checkbox, shift+click, BulkActionBar all work |
| Manual | START-HERE scripts work, distribution ZIP is self-contained |