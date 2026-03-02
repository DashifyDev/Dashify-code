"use client";
import { useContext, useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { globalContext } from "@/context/globalContext";
import { dashboardKeys } from "@/hooks/useDashboard";
import useAdmin from "@/hooks/isAdmin";
import { FREE_PLAN_MAX_BOARDS, FREE_PLAN_MAX_TILES_PER_BOARD, isUserPro } from "@/constants/plans";
import { safeSetItem, safeGetItem, safeRemoveItem } from "@/utils/safeLocalStorage";

function buildDefaultTiles(boardId) {
  const windowWidth = typeof window !== "undefined" ? window.innerWidth : 375;
  const mobileWidth = `${windowWidth - 48}px`;
  const base = { dashboardId: boardId, titleX: 1, titleY: 2, action: "textEditor", displayTitle: true, backgroundAction: "color", mobileX: 0 };
  return [
    { ...base, width: "540px", height: "156px", x: 25, y: 25, tileBackground: "#04b8c1", tileText: '<p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;"><strong>New Board Training | Step 1</strong></span></p><p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;">🖐️ Drag me anywhere, even resize me</span></p>', order: 1, mobileY: 0, mobileWidth },
    { ...base, width: "604px", height: "161px", x: 25, y: 191, tileBackground: "#2dbc83", tileText: '<p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;"><strong>New Board Training | Step 2</strong></span></p><p isspaced="false" isbordered="false" isneon="false" class=""><span style="font-family: Helvetica; color: rgb(255, 255, 255); font-size: 24px;">🎨 Click my menu (top-right corner) to change some things about me</span></p>', order: 2, mobileY: 166, mobileWidth },
  ];
}

export function useBoardOperations({ id, setShowDashboardModel }) {
  const { isLoading, user } = useUser();
  const {
    dbUser,
    tiles,
    setTiles,
    boards,
    setBoards,
    isBoardsLoaded,
    setIsBoardsLoaded,
  } = useContext(globalContext);
  const router = useRouter();
  const isAdmin = useAdmin();
  const queryClient = useQueryClient();

  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [selectedDashIndex, setSelectedDashIndex] = useState(null);
  const [dashBoardName, setDashBoardName] = useState("");
  const [showBoardLimitModal, setShowBoardLimitModal] = useState(false);
  const [showTileLimitModal, setShowTileLimitModal] = useState(false);

  // currentActiveBoard derived value needed by handlers
  const currentActiveBoard = id;

  // Data-loading useEffect
  useEffect(() => {
    if (dbUser && user) {
      // clear guest data to avoid localStorage shadowing server state
      safeRemoveItem("Dasify");
      safeRemoveItem("sessionId");
      axios
        .get(`/api/dashboard/addDashboard/?id=${dbUser._id}&t=${Date.now()}`)
        .then(res => {
          if (res && Array.isArray(res.data) && res.data.length >= 1) {
            setBoards(res.data);
            if (!id) router.push(`/dashboard/${res.data[0]._id}`);
          } else {
            setBoards([]);
          }
          if (!isBoardsLoaded) setIsBoardsLoaded(true);
        })
        .catch(err => {
          console.warn("Failed to load dashboards for user", err);
          setBoards([]);
          if (!isBoardsLoaded) setIsBoardsLoaded(true);
        });
    } else if (!isLoading && !user) {
      safeRemoveItem("sessionId");
      getDefaultDashboard();
    }
  }, [user, dbUser, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDefaultDashboard = async () => {
    const raw = safeGetItem("Dasify");
    const localData = raw ? JSON.parse(raw) : null;
    if (localData) {
      setBoards([...localData]);
      if (!id && localData.length > 0) router.push(`/dashboard/${localData[0]._id}`);
      if (!isBoardsLoaded) setIsBoardsLoaded(true);
      return;
    }
    axios
      .get("/api/dashboard/defaultDashboard")
      .then(res => {
        setBoards([...res.data]);
        if (!id && res.data.length > 0) router.push(`/dashboard/${res.data[0]._id}`);
        safeSetItem("Dasify", JSON.stringify(res.data));
        if (!isBoardsLoaded) setIsBoardsLoaded(true);
      })
      .catch(err => {
        console.warn("Failed to load default dashboards", err);
        setBoards([]);
        if (!isBoardsLoaded) setIsBoardsLoaded(true);
      });
  };

  const addTileForAuthUser = (newtile, currentTiles, detailKey) => {
    const MOBILE_TILE_HEIGHT = 166;
    const updatedTiles = currentTiles.map(tile => ({
      ...tile,
      order: (tile.order || 0) + 1,
      mobileY: (tile.mobileY || 0) + MOBILE_TILE_HEIGHT,
    }));
    const tempTile = { ...newtile, _id: `temp_${Date.now()}` };
    setTiles([tempTile, ...updatedTiles]);
    queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), oldData => {
      if (!oldData) return oldData;
      return { ...oldData, tiles: [tempTile, ...updatedTiles] };
    });
    const tilesToUpdate = currentTiles
      .filter(tile => tile._id && !tile._id.toString().startsWith("temp_"))
      .map(tile => ({
        tileId: tile._id,
        data: { order: (tile.order || 0) + 1, mobileY: (tile.mobileY || 0) + MOBILE_TILE_HEIGHT },
      }));
    const commitNewTile = () => {
      axios
        .post("/api/tile/tile", newtile)
        .then(res => {
          setTiles(prevTiles => prevTiles.map(t => (t._id === tempTile._id ? res.data : t)));
          queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), oldData => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              tiles: (oldData.tiles || []).map(t => (t._id === tempTile._id ? res.data : t)),
            };
          });
          queryClient.setQueryData(detailKey, old => {
            if (!old) return { ...res.data };
            return { ...old, tiles: (old.tiles || []).map(t => (t._id === tempTile._id ? res.data : t)) };
          });
        })
        .catch(error => {
          if (error?.response?.status === 403) {
            setShowTileLimitModal(true);
          } else {
            console.error("Error adding tile:", error);
          }
          setTiles(currentTiles);
          queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), oldData => {
            if (!oldData) return oldData;
            return { ...oldData, tiles: currentTiles };
          });
        });
    };
    if (tilesToUpdate.length > 0) {
      axios
        .post("/api/tile/batch-update", { updates: tilesToUpdate })
        .then(() => commitNewTile())
        .catch(err => {
          console.error("Error updating tile orders:", err);
          commitNewTile();
        });
    } else {
      commitNewTile();
    }
  };

  const addTileForGuest = (newtile, detailKey) => {
    const boardIndex = boards.findIndex(obj => obj._id === currentActiveBoard);
    if (boardIndex === -1) { console.error("Active dashboard not found for saving to localStorage"); return; }
    const items = JSON.parse(JSON.stringify(boards));
    if (!items[boardIndex].tiles) items[boardIndex].tiles = [];
    items[boardIndex].tiles = items[boardIndex].tiles.map(t => ({ ...t, order: (t.order || 0) + 1, mobileY: (t.mobileY || 0) + 166 }));
    items[boardIndex].tiles.unshift({ ...newtile, _id: `temp_${Date.now()}_${Math.random()}`, createdAt: new Date().toISOString() });
    safeSetItem("Dasify", JSON.stringify(items));
    setBoards(items);
    setTiles(() => items[boardIndex].tiles);
    const board = items[boardIndex];
    const cacheData = { _id: board._id, name: board.name || "", tiles: board.tiles, pods: board.pods || [] };
    queryClient.setQueryData(dashboardKeys.detail(currentActiveBoard), cacheData);
    queryClient.setQueryData(detailKey, cacheData);
    setTimeout(() => queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(currentActiveBoard), refetchType: "active" }), 0);
  };

  const addTiles = () => {
    const detailKey = dashboardKeys.detail(currentActiveBoard);
    const currentTiles = queryClient.getQueryData(detailKey)?.tiles || tiles || [];

    if (dbUser && !isAdmin && !isUserPro(dbUser) && currentTiles.length >= FREE_PLAN_MAX_TILES_PER_BOARD) {
      setShowTileLimitModal(true);
      return;
    }

    const smallTiles = currentTiles.filter(tile => parseInt(tile.width || "0", 10) <= 200);
    const col = smallTiles.length % 7;
    const row = Math.floor(smallTiles.length / 7);
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 375;
    const newtile = {
      dashboardId: currentActiveBoard,
      width: "135px", height: "135px",
      x: 25 + col * 145, y: 25 + row * 145,
      titleX: 2, titleY: 2,
      action: "textEditor", displayTitle: true, backgroundAction: "color",
      order: 1, mobileX: 0, mobileY: 0, mobileWidth: `${windowWidth - 48}px`,
    };

    if (dbUser) {
      addTileForAuthUser(newtile, currentTiles, detailKey);
    } else {
      addTileForGuest(newtile, detailKey);
    }
  };

  const addBoardForAuthUser = () => {
    const payload = isAdmin
      ? { name: dashBoardName, userId: dbUser._id, hasAdminAdded: true }
      : { name: dashBoardName, userId: dbUser._id };
    axios.post("/api/dashboard/addDashboard", payload).then(res => {
      const newBoard = res.data;
      const [defTile1, defTile2] = buildDefaultTiles(newBoard._id);
      const tempDefTile1 = { ...defTile1, _id: `temp_${Date.now()}_${Math.random()}` };
      const tempDefTile2 = { ...defTile2, _id: `temp_${Date.now() + 1}_${Math.random()}` };
      setTiles([tempDefTile1, tempDefTile2]);
      newBoard.tiles = [tempDefTile1, tempDefTile2];
      setBoards(prev => [newBoard, ...prev]);
      queryClient.setQueryData(dashboardKeys.detail(newBoard._id), { ...newBoard, tiles: [tempDefTile1, tempDefTile2] });
      axios
        .post("/api/tile/tiles", { dashboardId: newBoard._id, tiles: [defTile1, defTile2] })
        .then(tilesRes => {
          const realTiles = tilesRes.data.tiles || [];
          setTiles(realTiles);
          newBoard.tiles = realTiles;
          setBoards(prev => prev.map(board => (board._id === newBoard._id ? newBoard : board)));
          queryClient.setQueryData(dashboardKeys.detail(newBoard._id), { ...newBoard, tiles: realTiles });
        })
        .catch(error => {
          console.error("Error creating default tiles:", error);
          setTiles([]);
          setBoards(prev => prev.filter(board => board._id !== newBoard._id));
        });
      try {
        queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
        queryClient.setQueryData(dashboardKeys.detail(newBoard._id), newBoard);
      } catch (e) {
        console.warn("Failed to update query cache after creating dashboard", e);
      }
      router.push(`/dashboard/${newBoard._id}`);
    });
  };

  const addBoardForGuest = () => {
    const boardId = uuidv4();
    const [defTile1, defTile2] = buildDefaultTiles(boardId);
    const tempDefTile1 = { ...defTile1, _id: `temp_${Date.now()}_${Math.random()}` };
    const tempDefTile2 = { ...defTile2, _id: `temp_${Date.now() + 1}_${Math.random()}` };
    const payload = { _id: boardId, name: dashBoardName, tiles: [tempDefTile1, tempDefTile2] };
    const items = [payload, ...boards];
    safeSetItem("Dasify", JSON.stringify(items));
    setBoards(items);
    setTiles([tempDefTile1, tempDefTile2]);
    try {
      queryClient.setQueryData(dashboardKeys.detail(boardId), { ...payload, tiles: [tempDefTile1, tempDefTile2] });
    } catch (e) {
      console.warn("Failed to update query cache for guest board", e);
    }
    router.push(`/dashboard/${payload._id}`);
  };

  const addBoard = () => {
    setShowDashboardModel(false);
    if (dbUser && !isAdmin && !isUserPro(dbUser) && (boards || []).length >= FREE_PLAN_MAX_BOARDS) {
      setShowBoardLimitModal(true);
      return;
    }
    if (dbUser) {
      addBoardForAuthUser();
    } else {
      addBoardForGuest();
    }
  };

  const selectBoard = dashboardId => {
    router.push(`/dashboard/${dashboardId}`);
  };

  const updatedDashBoard = () => {
    setShowDashboardModel(false);
    if (dbUser) {
      axios.patch(`/api/dashboard/${selectedDashboard}`, { name: dashBoardName }).then(res => {
        if (res) setBoards(boards.map(board => (board._id === res.data._id ? res.data : board)));
      });
    } else {
      const items = boards.slice();
      const boardIndex = items.findIndex(obj => obj._id === selectedDashboard);
      items[boardIndex] = { ...items[boardIndex], name: dashBoardName };
      safeSetItem("Dasify", JSON.stringify(items));
    }
  };

  const changeDashboardName = e => setDashBoardName(e.target.value);

  const setBoardPosition = list => {
    if (dbUser) {
      setBoards(list);
      if (list.length > 1) {
        axios.patch("/api/dashboard/addDashboard", list.map((item, index) => ({ position: index + 1, _id: item._id }))).then(() => {});
      }
    } else if (list.length > 1) {
      setBoards(list);
      safeSetItem("Dasify", JSON.stringify(list));
    }
  };

  const setDash = (isLastIndex, index) => {
    if (isLastIndex && index === 0) {
      router.push("/dashboard");
    } else {
      isLastIndex ? selectBoard(boards[index - 1]._id) : selectBoard(boards[index]._id);
    }
  };

  const deleteAuthUserDashboard = (dashboardId, isLastIndex, index) => {
    axios
      .delete(`/api/dashboard/${dashboardId}`)
      .then(res => {
        if (res && (res.status === 200 || res.status === 204 || res.data)) {
          setBoards((boards || []).filter(b => String(b._id) !== String(dashboardId)));
          try {
            queryClient.removeQueries({ queryKey: dashboardKeys.detail(dashboardId) });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
          } catch (e) {
            console.warn("Failed to update query cache after delete", e);
          }
          if (dbUser && dbUser._id) {
            axios
              .get(`/api/dashboard/addDashboard/?id=${dbUser._id}&t=${Date.now()}`)
              .then(resp => { if (resp && Array.isArray(resp.data)) setBoards(resp.data); })
              .catch(e => console.warn("Failed to refresh boards after delete", e));
          }
          setDash(isLastIndex, index);
        } else {
          console.warn("Delete dashboard responded with unexpected status", res && res.status);
        }
      })
      .catch(err => { console.error("Failed to delete dashboard:", err); });
  };

  const deleteDashboard = (dashboardId, index) => {
    const isLastIndex = index === boards.length - 1;
    if (dbUser) {
      deleteAuthUserDashboard(dashboardId, isLastIndex, index);
    } else {
      const items = boards.slice();
      items.splice(index, 1);
      setBoards(items);
      safeSetItem("Dasify", JSON.stringify(items));
      setDash(isLastIndex, index);
    }
    setSelectedDashIndex(null);
  };

  const duplicateBoard = currentBoard => {
    if (dbUser) {
      const newBoard = { ...currentBoard };
      axios.post("/api/dashboard/duplicateDashboard", newBoard).then(res => {
        setBoards([...boards, res.data]);
      });
    } else {
      const newBoard = { ...currentBoard, _id: uuidv4() };
      setBoards([...boards, newBoard]);
      safeSetItem("Dasify", JSON.stringify([...boards, newBoard]), { showAlert: true });
    }
  };

  return {
    // State
    selectedDashboard,
    setSelectedDashboard,
    selectedDashIndex,
    setSelectedDashIndex,
    dashBoardName,
    setDashBoardName,
    showBoardLimitModal,
    setShowBoardLimitModal,
    showTileLimitModal,
    setShowTileLimitModal,
    // Handlers
    addBoard,
    addTiles,
    updatedDashBoard,
    deleteDashboard,
    setBoardPosition,
    duplicateBoard,
    changeDashboardName,
    selectBoard,
  };
}
