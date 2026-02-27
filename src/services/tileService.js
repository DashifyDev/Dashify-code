import "@/utils/db";
import Dashboard from "@/models/dashboard";
import { getUserPlan } from "./subscriptionService";
import { FREE_PLAN_MAX_TILES_PER_BOARD } from "@/constants/plans";

export class TileLimitError extends Error {
  constructor(limit) {
    super("Tile limit reached");
    this.status = 403;
    this.limit = limit;
  }
}

/**
 * Throws TileLimitError if authenticated Free user would exceed the per-board tile limit.
 * No-op for Pro users or when userId is absent.
 */
export async function enforceTileLimit(userId, dashboardId, incomingCount = 1) {
  const { isPro } = await getUserPlan(userId);
  if (isPro) return;

  const dashboard = await Dashboard.findById(dashboardId).select("tiles");
  const currentCount = dashboard?.tiles?.length || 0;

  if (currentCount + incomingCount > FREE_PLAN_MAX_TILES_PER_BOARD) {
    throw new TileLimitError(FREE_PLAN_MAX_TILES_PER_BOARD);
  }
}
