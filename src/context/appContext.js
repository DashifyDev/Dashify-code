"use client";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { globalContext } from "./globalContext";
import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";
import { ACTIVE_DASHBOARD_KEY } from "@/constants/plans";

function getActiveDashboardFromStorage() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_DASHBOARD_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed.name != null ? parsed : null;
  } catch {
    return null;
  }
}

function clearGuestStorage() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("Dasify");
      localStorage.removeItem(ACTIVE_DASHBOARD_KEY);
    }
  } catch (_) {
    /* ignore */
  }
}

const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const [tiles, setTiles] = useState([]);
  const [dbUser, setDbuser] = useState();
  const [activeBoard, setActiveBoard] = useState("");
  const [headerwidth, setHeaderWidth] = useState();
  const [boards, setBoards] = useState([]);
  const [isBoardsLoaded, setIsBoardsLoaded] = useState(false);

  React.useEffect(() => {
    if (!user) return;

    axios
      .post("/api/manage/getUser", user)
      .then(async res => {
        const userId = res.data._id;
        const activeDashboard = getActiveDashboardFromStorage();
        try {
          await axios.post("/api/manage/migrateGuestActiveBoard", {
            userId,
            activeDashboard,
          });
        } catch (e) {
          console.warn("Failed to migrate guest active board:", e);
        }
        clearGuestStorage();
        setDbuser(res.data);
      })
      .catch(error => {
        console.error("Error in getUser API:", error.response?.data || error.message);
      });
  }, [user]);

  return (
    <globalContext.Provider
      value={{
        tiles,
        setTiles,
        dbUser,
        activeBoard,
        setActiveBoard,
        setBoards,
        boards,
        setHeaderWidth,
        headerwidth,
        isBoardsLoaded,
        setIsBoardsLoaded,
      }}
    >
      {children}
    </globalContext.Provider>
  );
};

export default AppContextProvider;
