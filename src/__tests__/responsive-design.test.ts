import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSrc(relativePath: string): string {
  return readFileSync(join(__dirname, '..', relativePath), 'utf-8');
}

describe('responsive design — page.tsx', () => {
  const src = readSrc('app/page.tsx');

  it('uses reduced mobile padding on the header (px-4)', () => {
    expect(src).toContain('px-4');
  });

  it('scales header padding up at sm breakpoint (sm:px-6)', () => {
    expect(src).toContain('sm:px-6');
  });

  it('uses reduced mobile vertical padding on the header (py-6)', () => {
    expect(src).toContain('py-6');
  });

  it('scales header vertical padding up at sm breakpoint (sm:py-8)', () => {
    expect(src).toContain('sm:py-8');
  });

  it('uses a smaller base heading size (text-2xl) on mobile', () => {
    expect(src).toContain('text-2xl');
  });

  it('scales h1 up at sm breakpoint (sm:text-3xl)', () => {
    expect(src).toContain('sm:text-3xl');
  });

  it('has flex-wrap on the repository banner link row', () => {
    expect(src).toContain('flex flex-wrap');
  });
});

describe('responsive design — metrics-card.tsx', () => {
  const src = readSrc('components/metrics-card.tsx');

  it('uses text-xl as the base value size on mobile', () => {
    expect(src).toContain('text-xl');
  });

  it('scales metric value text up at sm breakpoint (sm:text-2xl)', () => {
    expect(src).toContain('sm:text-2xl');
  });
});

describe('responsive design — trend-charts.tsx', () => {
  const src = readSrc('components/trend-charts.tsx');

  it('has flex-wrap on the time-period selector', () => {
    expect(src).toContain('flex flex-wrap');
  });

  it('uses a smaller chart skeleton height on mobile (h-[200px])', () => {
    expect(src).toContain('h-[200px]');
  });

  it('scales chart skeleton height up at sm breakpoint (sm:h-[250px])', () => {
    expect(src).toContain('sm:h-[250px]');
  });
});

describe('responsive design — trend-chart.tsx', () => {
  const src = readSrc('components/trend-chart.tsx');

  it('uses a smaller chart container height on mobile (h-[200px])', () => {
    expect(src).toContain('h-[200px]');
  });

  it('scales chart container height up at sm breakpoint (sm:h-[250px])', () => {
    expect(src).toContain('sm:h-[250px]');
  });
});

describe('responsive design — dashboard-skeleton.tsx', () => {
  const src = readSrc('components/dashboard-skeleton.tsx');

  it('uses reduced mobile padding on the skeleton header (px-4)', () => {
    expect(src).toContain('px-4');
  });

  it('scales skeleton header padding up at sm breakpoint (sm:px-6)', () => {
    expect(src).toContain('sm:px-6');
  });

  it('scales skeleton vertical padding up at sm breakpoint (sm:py-8)', () => {
    expect(src).toContain('sm:py-8');
  });

  it('has flex-wrap on the skeleton period selector', () => {
    expect(src).toContain('flex flex-wrap');
  });

  it('uses a smaller chart skeleton height on mobile (h-[200px])', () => {
    expect(src).toContain('h-[200px]');
  });

  it('scales chart skeleton height up at sm breakpoint (sm:h-[250px])', () => {
    expect(src).toContain('sm:h-[250px]');
  });
});
