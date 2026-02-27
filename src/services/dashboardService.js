import "@/utils/db";
import Dashboard from "@/models/dashboard";
import Tile from "@/models/tile";
import Pod from "@/models/pod";
import User from "@/models/user";
import { getUserPlan } from "./subscriptionService";
import { FREE_PLAN_MAX_BOARDS, DEFAULT_BOARD_NAMES } from "@/constants/plans";

const normalizeBoardName = name => String(name || "").trim().toLowerCase();
const DEFAULT_BOARD_NAME_ALIASES = [...DEFAULT_BOARD_NAMES, "More Boards"];
const NORMALIZED_DEFAULT_BOARD_NAMES = new Set(
  DEFAULT_BOARD_NAME_ALIASES.map(normalizeBoardName)
);

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

  const adminBoards = await Dashboard.find({ userId: adminUser._id })
    .populate("tiles")
    .sort({ position: 1 });

  const userBoards = await Dashboard.find({ userId }).select("name position");
  const userBoardNames = new Set(userBoards.map(b => normalizeBoardName(b.name)));
  // New default boards get positions after the current max position.
  let maxPosition = userBoards.reduce((max, b) => {
    const pos = Number(b.position) || 0;
    return pos > max ? pos : max;
  }, 0);

  for (const boardName of DEFAULT_BOARD_NAMES) {
    const normalizedTargetName = normalizeBoardName(boardName);
    if (userBoardNames.has(normalizedTargetName)) continue;

    // Re-check before create to avoid duplicates if ensureDefaultBoards runs concurrently
    const alreadyExists = await Dashboard.find({ userId }).select("name _id tiles").lean();
    const alreadyExistsByName = alreadyExists.find(
      b => normalizeBoardName(b.name) === normalizedTargetName
    );
    if (alreadyExistsByName) {
      const existingTiles = Array.isArray(alreadyExistsByName.tiles) ? alreadyExistsByName.tiles : [];
      if (existingTiles.length === 0) {
        const adminBoardForExisting = adminBoards.find(
          b => normalizeBoardName(b.name) === normalizedTargetName
        );
        if (adminBoardForExisting) {
          const tileCopies = (adminBoardForExisting.tiles || []).map(t => {
            const { _id, ...rest } = t.toObject ? t.toObject() : t;
            return rest;
          });
          if (tileCopies.length > 0) {
            const createdTiles = await Tile.insertMany(tileCopies);
            await Dashboard.updateOne(
              { _id: alreadyExistsByName._id },
              {
                $set: {
                  tiles: createdTiles.map(t => t._id),
                  default: adminBoardForExisting.default || false,
                },
              }
            );
          }
        }
      }
      userBoardNames.add(normalizedTargetName);
      continue;
    }

    const adminBoard = adminBoards.find(
      b => normalizeBoardName(b.name) === normalizedTargetName
    );
    if (!adminBoard) {
      maxPosition += 1;
      try {
        await Dashboard.create({
          userId,
          name: boardName,
          tiles: [],
          pods: [],
          default: false,
          position: maxPosition,
        });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
      userBoardNames.add(normalizedTargetName);
      continue;
    }

    const tileCopies = (adminBoard.tiles || []).map(t => {
      const { _id, ...rest } = t.toObject ? t.toObject() : t;
      return rest;
    });

    const createdTiles = tileCopies.length > 0 ? await Tile.insertMany(tileCopies) : [];
    maxPosition += 1;

    try {
      await Dashboard.create({
        userId,
        name: adminBoard.name,
        tiles: createdTiles.map(t => t._id),
        default: adminBoard.default || false,
        position: maxPosition,
      });
    } catch (err) {
      // E11000 = duplicate key; another request already created this board
      if (err.code === 11000) {
        if (createdTiles.length) {
          await Tile.deleteMany({ _id: { $in: createdTiles.map(t => t._id) } });
        }
      } else {
        throw err;
      }
    }
    userBoardNames.add(normalizedTargetName);
  }
}

/**
 * Removes duplicate default boards for a user (same userId + default board name).
 * Keeps the earliest created board per default name and deletes tile/pod orphans.
 */
async function removeDuplicateDefaultBoardsForUser(userId) {
  const boards = await Dashboard.find({ userId }).select("name tiles pods createdAt _id").lean();
  const byName = new Map();
  for (const b of boards) {
    const normalizedName = normalizeBoardName(b.name);
    if (!NORMALIZED_DEFAULT_BOARD_NAMES.has(normalizedName)) continue;
    const list = byName.get(normalizedName) || [];
    list.push(b);
    byName.set(normalizedName, list);
  }
  for (const [_name, list] of byName) {
    if (list.length <= 1) continue;
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const [keep, ...duplicates] = list;
    for (const dup of duplicates) {
      const tileIds = dup.tiles || [];
      const podIds = dup.pods || [];
      if (tileIds.length) await Tile.deleteMany({ _id: { $in: tileIds } });
      if (podIds.length) await Pod.deleteMany({ _id: { $in: podIds } });
      await Dashboard.deleteOne({ _id: dup._id });
    }
  }
}

async function removeDuplicateBoardsByGuestSource(userId, guestSourceId) {
  if (!guestSourceId) return;
  const boards = await Dashboard.find({ userId, guestSourceId })
    .select("tiles pods createdAt _id")
    .lean();
  if (boards.length <= 1) return;

  boards.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const [keep, ...duplicates] = boards;
  for (const dup of duplicates) {
    const tileIds = dup.tiles || [];
    const podIds = dup.pods || [];
    if (tileIds.length) await Tile.deleteMany({ _id: { $in: tileIds } });
    if (podIds.length) await Pod.deleteMany({ _id: { $in: podIds } });
    await Dashboard.deleteOne({ _id: dup._id });
  }
}

async function migrateSingleGuestBoard(userId, guestBoard) {
  if (!guestBoard || !guestBoard.name) return;
  const guestSourceId = guestBoard?._id ? String(guestBoard._id) : null;
  const normalizedName = normalizeBoardName(guestBoard.name);
  if (NORMALIZED_DEFAULT_BOARD_NAMES.has(normalizedName)) return;

  await removeDuplicateBoardsByGuestSource(userId, guestSourceId);

  const existing = guestSourceId
    ? await Dashboard.findOne({ userId, guestSourceId })
    : await Dashboard.findOne({ userId, name: guestBoard.name });
  if (existing) return;

  const tiles = (guestBoard.tiles || []).map(t => {
    const { _id, ...rest } = t;
    return rest;
  });
  const createdTiles = tiles.length > 0 ? await Tile.insertMany(tiles) : [];

  const pods = (guestBoard.pods || []).map(p => {
    const { _id, ...rest } = p;
    return rest;
  });
  const createdPods = pods.length > 0 ? await Pod.insertMany(pods) : [];

  const userBoards = await Dashboard.find({ userId }).select("position").lean();
  const maxPosition = userBoards.reduce((max, b) => {
    const pos = Number(b.position) || 0;
    return pos > max ? pos : max;
  }, 0);
  try {
    await Dashboard.create({
      userId,
      name: guestBoard.name,
      tiles: createdTiles.map(t => t._id),
      pods: createdPods.map(p => p._id),
      default: guestBoard.default || false,
      position: maxPosition + 1,
      ...(guestSourceId ? { guestSourceId } : {}),
    });
  } catch (err) {
    if (err.code === 11000) {
      if (createdTiles.length) {
        await Tile.deleteMany({ _id: { $in: createdTiles.map(t => t._id) } });
      }
      if (createdPods.length) {
        await Pod.deleteMany({ _id: { $in: createdPods.map(p => p._id) } });
      }
    } else {
      throw err;
    }
  }
}

export async function migrateGuestDashboards({ userId, activeDashboard, guestBoards = [] }) {
  await removeDuplicateDefaultBoardsForUser(userId);

  const normalizedActiveId = activeDashboard?._id ? String(activeDashboard._id) : null;
  const mergedBoards = [];
  const seenSources = new Set();

  const pushBoard = (board) => {
    if (!board || !board.name) return;
    const sourceId = board?._id ? String(board._id) : "";
    const nameKey = normalizeBoardName(board.name);
    const key = sourceId ? `id:${sourceId}` : `name:${nameKey}`;
    if (seenSources.has(key)) return;
    seenSources.add(key);
    mergedBoards.push(board);
  };

  // Active board first so it stays closest to previous guest context.
  if (activeDashboard) pushBoard(activeDashboard);
  for (const board of Array.isArray(guestBoards) ? guestBoards : []) {
    pushBoard(board);
  }

  for (const board of mergedBoards) {
    await migrateSingleGuestBoard(userId, board);
  }

  await ensureDefaultBoards(userId);
  await removeDuplicateDefaultBoardsForUser(userId);
  if (normalizedActiveId) {
    await removeDuplicateBoardsByGuestSource(userId, normalizedActiveId);
  }
}

/**
 * Migrates a single guest activeDashboard to the DB for the given userId.
 * If activeDashboard is null or is a default board, only ensures default boards exist.
 * Never creates duplicate boards (checked by name).
 */
export async function migrateActiveDashboard({ userId, activeDashboard }) {
  await migrateGuestDashboards({ userId, activeDashboard, guestBoards: activeDashboard ? [activeDashboard] : [] });
}
