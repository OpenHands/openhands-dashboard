import { describe, it, expect } from 'vitest';
import { TARGET_CONFIG } from '../lib/target-config';

describe('TARGET_CONFIG.dependencySearches', () => {
  it('contains at least one query', () => {
    expect(TARGET_CONFIG.dependencySearches.length).toBeGreaterThan(0);
  });

  it.each(TARGET_CONFIG.dependencySearches)(
    'query "%s" does not use NOT as a qualifier negation operator',
    (query) => {
      expect(query).not.toMatch(/\bNOT\s+\w+:/);
    }
  );

  it.each(TARGET_CONFIG.dependencySearches)(
    'query "%s" is scoped to a dependency declaration filename',
    (query) => {
      const scopedToDependencyFile = query.includes('filename:requirements.txt')
        || query.includes('filename:pyproject.toml')
        || query.includes('filename:setup.py')
        || query.includes('filename:setup.cfg');
      expect(scopedToDependencyFile).toBe(true);
    }
  );

  it.each(TARGET_CONFIG.dependencySearches)(
    'query "%s" excludes the OpenHands org to avoid self-referential noise',
    (query) => {
      expect(query).toContain('-org:OpenHands');
    }
  );

  it('searches for the PyPI distribution name "openhands-ai" in requirements.txt', () => {
    const hasRequirementsTxt = TARGET_CONFIG.dependencySearches.some(
      (query) => query.includes('"openhands-ai"') && query.includes('filename:requirements.txt')
    );
    expect(hasRequirementsTxt).toBe(true);
  });

  it('searches for "openhands-ai" in pyproject.toml', () => {
    const hasPyproject = TARGET_CONFIG.dependencySearches.some(
      (query) => query.includes('"openhands-ai"') && query.includes('filename:pyproject.toml')
    );
    expect(hasPyproject).toBe(true);
  });
});
