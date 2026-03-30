export const TARGET_CONFIG = {
  name: 'OpenHands',
  description: 'Metrics dashboard for the OpenHands GitHub repository and Python package',
  github: {
    owner: 'OpenHands',
    repo: 'OpenHands',
    url: 'https://github.com/OpenHands/OpenHands',
  },
  pypi: {
    package: 'openhands-ai',
    url: 'https://pypi.org/project/openhands-ai/',
  },
  npm: null, // Python project - no npm package
  /**
   * GitHub code-search queries used to count public repositories that depend on
   * or reference OpenHands via standard Python dependency files.
   *
   * All queries are scoped to package-dependency declaration files so that
   * documentation, markdown notes, and unrelated source files do not inflate
   * the dependent-repos count.
   *
   * 1. pip / uv / conda — "openhands-ai" in requirements.txt
   * 2. Poetry / Hatch / PDM — "openhands-ai" in pyproject.toml
   * 3. Git-source installs — direct GitHub OpenHands/OpenHands references in
   *    pyproject.toml or requirements.txt
   *
   * All queries exclude the OpenHands org so the repository's own projects are
   * not counted.
   */
  dependencySearches: [
    '"openhands-ai" filename:requirements.txt -org:OpenHands',
    '"openhands-ai" filename:pyproject.toml -org:OpenHands',
    '"github.com/OpenHands/OpenHands" filename:pyproject.toml -org:OpenHands',
    '"github.com/OpenHands/OpenHands" filename:requirements.txt -org:OpenHands',
  ],
} as const;
