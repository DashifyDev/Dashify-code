import "@/utils/db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import User from "@/models/user";
import { getUserPlan } from "./subscriptionService";
import { FREE_PLAN_MAX_BOARDS, DEFAULT_BOARD_NAMES } from "@/constants/plans";

export class BoardLimitError extends Error {
  constructor(limit) {
    super("Board limit reached");
    this.status = 403;
    this.limit = limit;
  }
}

/**
 * Throws BoardLimitError if authenticated Free user is at or above the board limit.
 * No-op for Pro users.
 */
export async function enforceBoardLimit(userId) {
  const { isPro } = await getUserPlan(userId);
  if (isPro) return;

  const count = await Dashboard.countDocuments({ userId });
  if (count >= FREE_PLAN_MAX_BOARDS) {
    throw new BoardLimitError(FREE_PLAN_MAX_BOARDS);
  }
}

/**
 * Idempotent: ensures the user has copies of "Welcome to Boardzy!" and "More Boards".
 * Reads the originals from the contact@boardzy.app admin user.
 * Skips any board the user already has (matched by name).
 */
export async function ensureDefaultBoards(userId) {
  const adminUser = await User.findOne({ email: "contact@boardzy.app" });
  if (!adminUser) return;

  const userBoards = await Dashboard.find({ userId }).select("name position");
  const userBoardNames = new Set(userBoards.map(b => b.name));
  // New default boards get positions after existing ones (e.g. after migrated custom board)
  let position = userBoards.length + 1;

  for (const boardName of DEFAULT_BOARD_NAMES) {
    if (userBoardNames.has(boardName)) continue;

    // Re-check before create to avoid duplicates if ensureDefaultBoards runs concurrently
    const alreadyExists = await Dashboard.findOne({ userId, name: boardName }).select("_id");
    if (alreadyExists) {
      userBoardNames.add(boardName);
      continue;
    }

    const adminBoard = await Dashboard.findOne({
      userId: adminUser._id,
      name: boardName,
    }).populate("tiles");

    if (!adminBoard) continue;

    const tileCopies = (adminBoard.tiles || []).map(t => {
      const { _id, ...rest } = t.toObject ? t.toObject() : t;
      return rest;
    });

    const createdTiles = tileCopies.length > 0 ? await Tile.insertMany(tileCopies) : [];
    position += 1;

    await Dashboard.create({
      userId,
      name: adminBoard.name,
      tiles: createdTiles.map(t => t._id),
      default: adminBoard.default || false,
      position,
    });
    userBoardNames.add(adminBoard.name);
  }
}

/**
 * Migrates a single guest activeDashboard to the DB for the given userId.
 * If activeDashboard is null or is a default board, only ensures default boards exist.
 * Never creates duplicate boards (checked by name).
 */
export async function migrateActiveDashboard({ userId, activeDashboard }) {
  const isDefaultBoard =
    !activeDashboard || DEFAULT_BOARD_NAMES.includes(activeDashboard.name);

  if (!isDefaultBoard) {
    const existing = await Dashboard.findOne({ userId, name: activeDashboard.name });

    if (!existing) {
      // Strip guest _ids from tiles
      const tiles = (activeDashboard.tiles || []).map(t => {
        const { _id, ...rest } = t;
        return rest;
      });
      const createdTiles = tiles.length > 0 ? await Tile.insertMany(tiles) : [];

      // Strip guest _ids from pods
      const pods = (activeDashboard.pods || []).map(p => {
        const { _id, ...rest } = p;
        return rest;
      });
      const createdPods = pods.length > 0 ? await Pod.insertMany(pods) : [];

      const count = await Dashboard.countDocuments({ userId });
      await Dashboard.create({
        userId,
        name: activeDashboard.name,
        tiles: createdTiles.map(t => t._id),
        pods: createdPods.map(p => p._id),
        default: activeDashboard.default || false,
        position: count + 1,
      });
    }
  }

  await ensureDefaultBoards(userId);
}
