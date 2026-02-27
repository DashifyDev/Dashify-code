"use client";
import React, { useState, useRef } from "react";
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

function getGuestBoardsFromStorage() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("Dasify") : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((b) => b && typeof b === "object" && b.name) : [];
  } catch {
    return [];
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
  const { user, isLoading } = useUser();
  const [tiles, setTiles] = useState([]);
  const [dbUser, setDbuser] = useState();
  const [activeBoard, setActiveBoard] = useState("");
  const [headerwidth, setHeaderWidth] = useState();
  const [boards, setBoards] = useState([]);
  const [isBoardsLoaded, setIsBoardsLoaded] = useState(false);
  const migratedForAuth0SubRef = useRef(null);
  const migrationInFlightRef = useRef(false);
  const [migrationRetryTick, setMigrationRetryTick] = useState(0);

  React.useEffect(() => {
    if (isLoading) return;

    if (!user?.sub) {
      migratedForAuth0SubRef.current = null;
      migrationInFlightRef.current = false;
      setDbuser(undefined);
      return;
    }

    if (migrationInFlightRef.current || migratedForAuth0SubRef.current === user.sub) {
      return;
    }

    let cancelled = false;
    migrationInFlightRef.current = true;

    (async () => {
      try {
        const res = await axios.post("/api/manage/getUser", user);
        if (cancelled) return;

        const userId = res.data._id;
        const activeDashboard = getActiveDashboardFromStorage();
        const guestBoards = getGuestBoardsFromStorage();

        let migrationSucceeded = true;
        if (activeDashboard || guestBoards.length > 0) {
          migrationSucceeded = false;

          // Auth session cookie can lag right after signup/login.
          // Retry migration a few times before giving up.
          for (let attempt = 1; attempt <= 5; attempt += 1) {
            try {
              await axios.post("/api/manage/migrateGuestActiveBoard", {
                userId,
                activeDashboard,
                guestBoards,
              });
              migrationSucceeded = true;
              break;
            } catch (e) {
              const status = e?.response?.status;
              const retryable = status === 401 || status === 403 || status >= 500;
              if (!retryable || attempt === 5) {
                console.warn("Failed to migrate guest active board:", e);
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
            }
          }
        }

        if (cancelled) return;

        setDbuser(res.data);
        if (migrationSucceeded) {
          clearGuestStorage();
          migratedForAuth0SubRef.current = user.sub;
        } else {
          // Keep guest data and retry migration shortly.
          setTimeout(() => {
            if (!cancelled) {
              setMigrationRetryTick((v) => v + 1);
            }
          }, 1200);
        }
      } catch (error) {
        console.error("Error in getUser API:", error.response?.data || error.message);
      } finally {
        if (!cancelled) {
          migrationInFlightRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
      migrationInFlightRef.current = false;
    };
  }, [isLoading, user?.sub, migrationRetryTick]);

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
