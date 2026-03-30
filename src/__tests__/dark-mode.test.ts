import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSrc(relativePath: string): string {
  return readFileSync(join(__dirname, '..', relativePath), 'utf-8');
}

describe('dark mode — theme-provider.tsx', () => {
  const src = readSrc('components/theme-provider.tsx');

  it('exports ThemeProvider component', () => {
    expect(src).toContain('export function ThemeProvider');
  });

  it('exports useTheme hook', () => {
    expect(src).toContain('export function useTheme');
  });

  it('persists theme preference to localStorage', () => {
    expect(src).toContain('localStorage.setItem');
    expect(src).toContain("'theme'");
  });

  it('loads persisted theme from localStorage on mount', () => {
    expect(src).toContain('localStorage.getItem');
  });

  it('toggles dark class on the document root', () => {
    expect(src).toContain('classList.toggle');
    expect(src).toContain("'dark'");
  });

  it('supports system theme based on OS preference', () => {
    expect(src).toContain('prefers-color-scheme: dark');
  });

  it('listens for OS preference changes in system mode', () => {
    expect(src).toContain('addEventListener');
    expect(src).toContain('change');
  });

  it('exposes resolvedTheme (light or dark) via context', () => {
    expect(src).toContain('resolvedTheme');
  });
});

describe('dark mode — theme-toggle.tsx', () => {
  const src = readSrc('components/theme-toggle.tsx');

  it('exports ThemeToggle component', () => {
    expect(src).toContain('export function ThemeToggle');
  });

  it('uses Sun icon for dark mode (switch to light)', () => {
    expect(src).toContain('Sun');
  });

  it('uses Moon icon for light mode (switch to dark)', () => {
    expect(src).toContain('Moon');
  });

  it('has an accessible aria-label', () => {
    expect(src).toContain('aria-label');
  });

  it('calls setTheme to toggle between light and dark', () => {
    expect(src).toContain('setTheme');
  });

  it('uses ghost button variant', () => {
    expect(src).toContain("variant=\"ghost\"");
  });
});

describe('dark mode — layout.tsx', () => {
  const src = readSrc('app/layout.tsx');

  it('imports ThemeProvider', () => {
    expect(src).toContain('ThemeProvider');
  });

  it('wraps children with ThemeProvider', () => {
    expect(src).toContain('<ThemeProvider>');
  });

  it('adds suppressHydrationWarning to html element', () => {
    expect(src).toContain('suppressHydrationWarning');
  });
});

describe('dark mode — page.tsx', () => {
  const src = readSrc('app/page.tsx');

  it('imports ThemeToggle', () => {
    expect(src).toContain("ThemeToggle");
  });

  it('renders ThemeToggle in the header', () => {
    expect(src).toContain('<ThemeToggle');
  });

  it('uses bg-background instead of hardcoded bg-gray-50', () => {
    expect(src).toContain('bg-background');
    expect(src).not.toContain('bg-gray-50');
  });

  it('uses text-foreground instead of hardcoded text-gray-700 for headings', () => {
    expect(src).toContain('text-foreground');
    expect(src).not.toContain('text-gray-700');
  });
});

describe('dark mode — dashboard-skeleton.tsx', () => {
  const src = readSrc('components/dashboard-skeleton.tsx');

  it('uses bg-background instead of hardcoded bg-gray-50', () => {
    expect(src).toContain('bg-background');
    expect(src).not.toContain('bg-gray-50');
  });

  it('uses text-foreground instead of hardcoded text-gray-700 for headings', () => {
    expect(src).toContain('text-foreground');
    expect(src).not.toContain('text-gray-700');
  });
});

describe('dark mode — trend-chart.tsx', () => {
  const src = readSrc('components/trend-chart.tsx');

  it('imports useTheme for theme-aware chart colors', () => {
    expect(src).toContain('useTheme');
  });

  it('uses bg-background in tooltip for dark mode compatibility', () => {
    expect(src).toContain('bg-background');
  });

  it('uses border-border in tooltip for dark mode compatibility', () => {
    expect(src).toContain('border-border');
  });

  it('uses text-muted-foreground in tooltip label', () => {
    expect(src).toContain('text-muted-foreground');
  });

  it('uses theme-aware grid color variable', () => {
    expect(src).toContain('gridColor');
  });

  it('uses theme-aware axis color variable', () => {
    expect(src).toContain('axisColor');
  });
});
