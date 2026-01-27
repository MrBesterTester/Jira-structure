/**
 * KeyboardShortcutsModal - Shows available keyboard shortcuts
 * 
 * Triggered by pressing '?' or from the help menu.
 * Displays all keyboard shortcuts in organized sections.
 */

import { useEffect, useState } from 'react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutItem[];
}

const shortcutSections: ShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate between issues' },
      { keys: ['←', '→'], description: 'Collapse/Expand in tree view' },
      { keys: ['Enter'], description: 'Open issue detail panel' },
      { keys: ['Esc'], description: 'Close panel / Clear selection' },
    ],
  },
  {
    title: 'Issue Actions',
    shortcuts: [
      { keys: ['C'], description: 'Create new issue' },
      { keys: ['E'], description: 'Edit selected issue' },
      { keys: ['Delete', 'Backspace'], description: 'Delete selected issues' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['⌘/Ctrl', '+', 'A'], description: 'Select all visible issues' },
      { keys: ['Shift', '+', 'Click'], description: 'Select range of issues' },
      { keys: ['⌘/Ctrl', '+', 'Click'], description: 'Toggle issue selection' },
    ],
  },
  {
    title: 'Search & Views',
    shortcuts: [
      { keys: ['/'], description: 'Focus search bar' },
      { keys: ['1'], description: 'Switch to Tree view' },
      { keys: ['2'], description: 'Switch to Kanban view' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts (this modal)' },
    ],
  },
];

// Key component for displaying keyboard shortcuts
const KeyBadge = ({ children }: { children: string }) => (
  <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700 shadow-sm">
    {children}
  </kbd>
);

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for '?' key to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-500">
                Quick actions for faster navigation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutSections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-600">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          key === '+' ? (
                            <span key={keyIndex} className="text-gray-400 text-xs">+</span>
                          ) : (
                            <KeyBadge key={keyIndex}>{key}</KeyBadge>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Press <KeyBadge>Esc</KeyBadge> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
