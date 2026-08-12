import { z } from "zod";

export const dashboardAnalyticsSchema = z.object({
  summary: z.object({
    publishedPosts: z.number().int().nonnegative(),
    totalViews: z.number().int().nonnegative(),
    totalSaves: z.number().int().nonnegative(),
    currentFollowers: z.number().int().nonnegative(),
  }),
  postMetrics: z.record(z.string(), z.object({ views: z.number().int().nonnegative(), saves: z.number().int().nonnegative() })),
  followerGrowth: z.array(z.object({ date: z.string(), change: z.number().int() })),
});

export type DashboardAnalytics = z.infer<typeof dashboardAnalyticsSchema>;
