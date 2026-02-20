"use client";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { globalContext } from "./globalContext";
import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";

const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const [tiles, setTiles] = useState([]);
  const [dbUser, setDbuser] = useState();
  const [activeBoard, setActiveBoard] = useState("");
  const [headerwidth, setHeaderWidth] = useState();
  const [boards, setBoards] = useState([]);
  const [isBoardsLoaded, setIsBoardsLoaded] = useState(false);

  React.useEffect(() => {
    let localData = JSON.parse(localStorage.getItem("Dasify"));
    if (user) {
      axios
        .post("/api/manage/getUser", user)
        .then(async (res) => {
          // If guest data exists, migrate it BEFORE setting dbUser.
          // This ensures boards are available in the DB when Header fetches them.
          if (localData) {
            localStorage.removeItem("Dasify");
            try {
              await addGuestUserData(res.data._id, localData);
            } catch (e) {
              console.warn("Failed to migrate guest data:", e);
            }
          }
          setDbuser(res.data);
        })
        .catch((error) => {
          console.error(
            "Error in getUser API:",
            error.response?.data || error.message,
          );
        });
    }
  }, [user]);

  const addGuestUserData = (userId, localData) => {
    return axios
      .post("/api/manage/addGuestData", { userId: userId, localData })
      .then((res) => {
        localStorage.removeItem("Dasify");
      });
  };

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
