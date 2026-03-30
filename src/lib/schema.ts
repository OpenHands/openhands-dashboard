import { pgTable, serial, varchar, timestamp, integer, date, unique } from 'drizzle-orm/pg-core';

export const trackedRepositories = pgTable('sdks', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  githubRepo: varchar('github_repo', { length: 255 }),
  npmPackage: varchar('npm_package', { length: 255 }),
  pypiPackage: varchar('pypi_package', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const metricsSnapshots = pgTable('metrics_snapshots', {
  id: serial('id').primaryKey(),
  repositoryId: integer('sdk_id').references(() => trackedRepositories.id),
  date: date('date').notNull(),
  githubStars: integer('github_stars'),
  githubForks: integer('github_forks'),
  githubActiveForks: integer('github_active_forks'),
  githubContributors: integer('github_contributors'),
  githubRepeatContributors: integer('github_repeat_contributors'),
  githubDependentRepos: integer('github_dependent_repos'),
  npmDownloadsWeekly: integer('npm_downloads_weekly'),
  pypiDownloadsWeekly: integer('pypi_downloads_weekly'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  unique().on(table.repositoryId, table.date),
]);

export type TrackedRepository = typeof trackedRepositories.$inferSelect;
export type NewTrackedRepository = typeof trackedRepositories.$inferInsert;
export type MetricsSnapshot = typeof metricsSnapshots.$inferSelect;
export type NewMetricsSnapshot = typeof metricsSnapshots.$inferInsert;
