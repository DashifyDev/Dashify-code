"use client";
import { useState, React, useContext, useEffect, use, useRef } from "react";
import AddSharpIcon from "@mui/icons-material/AddSharp";
import {
  AppBar,
  Toolbar,
  Grid,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardMedia,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CssBaseline from "@mui/material/CssBaseline";
import { IconButton, Avatar, Button, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SideDrawer from "./SideDrawer";
import { globalContext } from "@/context/globalContext";
import { ReactSortable } from "react-sortablejs";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import isDblTouchTap from "@/hooks/isDblTouchTap";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "../styles/header.css";
import logo from "../assets/logo.png";
import Image from "next/image";
import leftArrow from "../assets/leftArrow1.svg";
import rightArrow from "../assets/rightArrow.svg";
import { useRouter } from "next/navigation";
import useAdmin from "@/hooks/isAdmin";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/hooks/useDashboard";

function Header() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showIcon, setShowIcon] = useState(null);
  const [openDashDeleteModel, setOpenDashDeleteModel] = useState(false);
  const [selectedDashIndex, setSelectedDashIndex] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [showDeshboardModel, setShowDashboardModel] = useState(false);
  const [dashBoardName, setDashBoardName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [options, setOptions] = useState(null);
  const { isLoading, user } = useUser();
  const {
    dbUser,
    tiles,
    setTiles,
    activeBoard,
    setActiveBoard,
    boards,
    setBoards,
    headerwidth,
    isBoardsLoaded,
    setIsBoardsLoaded
  } = useContext(globalContext);
  const divRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const router = useRouter();
  const isAdmin = useAdmin();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const currentActiveBoard = id || activeBoard;

  useEffect(() => {
    if (id && id !== activeBoard) {
      setActiveBoard(id);
    }
  }, [id, activeBoard, setActiveBoard]);
  const [shareLinkModal, setShareLinkModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  useEffect(() => {
    const divElement = divRef.current.ref.current;
    if (divElement) {
      if (divElement.scrollWidth > divElement.clientWidth) {
        setIsOverflowing(true);
      } else {
        setIsOverflowing(false);
      }
    }
  }, [boards]);

  const handleScroll = (direction) => {
    const divElement = divRef.current.ref.current;

    if (divElement) {
      if (direction === "left") {
        divElement.scrollLeft -= 100;
      } else if (direction === "right") {
        divElement.scrollLeft += 100;
      }
    }
  };

  useEffect(() => {
    // Always prefer authoritative server list for authenticated users.
    if (dbUser && user) {
      // clear any guest data to avoid localStorage shadowing server state
      try {
        localStorage.removeItem("Dasify");
        localStorage.removeItem("sessionId");
      } catch (e) {
        /* ignore */
      }

      axios
        .get(`/api/dashboard/addDashboard/?id=${dbUser._id}&t=${Date.now()}`)
        .then((res) => {
          if (res && Array.isArray(res.data) && res.data.length >= 1) {
            setBoards(res.data);
            if (!id) {
              router.push(`/dashboard/${res.data[0]._id}`);
            }
          } else {
            setBoards([]);
          }
          if (!isBoardsLoaded) setIsBoardsLoaded(true)
        })
        .catch((err) => {
          console.warn("Failed to load dashboards for user", err);
          setBoards([]);
          if (!isBoardsLoaded) setIsBoardsLoaded(true)
        });
    } else {
      if (!isLoading && !user) {
        // Clear user cache when switching to guest mode
        try {
          localStorage.removeItem("sessionId");
        } catch (e) {
          /* ignore */
        }
        getDefaultDashboard();
      }
    }
  }, [user, dbUser, isLoading]);

  const getDefaultDashboard = async () => {
    let localData = JSON.parse(localStorage.getItem("Dasify"));

    if (localData) {
      setBoards((prev) => [...localData]);
      if (!id) {
        if (localData.length > 0) {
          router.push(`/dashboard/${localData[0]._id}`);
        }
      }
      if (!isBoardsLoaded) setIsBoardsLoaded(true)
      return;
    }

    axios.get("/api/dashboard/defaultDashboard").then((res) => {
      setBoards((prev) => [...res.data]);
      if (!id) {
        if (res.data.length > 0) {
          router.push(`/dashboard/${res.data[0]._id}`);
        }
      }
      localStorage.setItem("Dasify", JSON.stringify(res.data));
    });
  };

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  const addTiles = () => {
    const TILE_WIDTH = 135;
    const TILE_HEIGHT = 135;
    const FIXED_X = 25;
    const FIXED_Y = 25;

    // Always place new block in one fixed location
    const newX = FIXED_X;
    const newY = FIXED_Y;

    const newtile = {
      dashboardId: currentActiveBoard,
      width: `${TILE_WIDTH}px`,
      height: `${TILE_HEIGHT}px`,
      x: newX,
      y: newY,
      titleX: 2,
      titleY: 2,
      action: "textEditor",
      displayTitle: true,
      backgroundAction: "color",
    };

    const detailKey = dashboardKeys.detail(currentActiveBoard);

    if (dbUser) {
      // Optimistic update
      const tempTile = { ...newtile, _id: `temp_${Date.now()}` };
      setTiles([...tiles, tempTile]);

      // Update React Query cache optimistically
      queryClient.setQueryData(
        dashboardKeys.detail(currentActiveBoard),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tiles: [...(oldData.tiles || []), tempTile],
          };
        }
      );

      axios
        .post("/api/tile/tile", newtile)
        .then((res) => {
          // Replace temporary block with real one
          setTiles((prevTiles) =>
            prevTiles.map((tile) =>
              tile._id === tempTile._id ? res.data : tile
            )
          );

          // Update React Query cache
          queryClient.setQueryData(
            dashboardKeys.detail(currentActiveBoard),
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: (oldData.tiles || []).map((tile) =>
                  tile._id === tempTile._id ? res.data : tile
                ),
              };
            }
          );
          // ensure subscribers see the latest data
          queryClient.setQueryData(detailKey, (old) => {
            if (!old) return { ...res.data };
            return {
              ...(old || {}),
              tiles: (old.tiles || []).map((t) =>
                t._id === tempTile._id ? res.data : t
              ),
            };
          });
        })
        .catch((error) => {
          console.error("Error adding tile:", error);
          // Remove temporary block on error
          setTiles((prevTiles) =>
            prevTiles.filter((tile) => tile._id !== tempTile._id)
          );

          queryClient.setQueryData(
            dashboardKeys.detail(currentActiveBoard),
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                tiles: oldData.tiles.filter(
                  (tile) => tile._id !== tempTile._id
                ),
              };
            }
          );
        });
    } else {
      let boardIndex = boards.findIndex(
        (obj) => obj._id === currentActiveBoard
      );
      if (boardIndex === -1) {
        console.error(
          "Active dashboard not found for saving to localStorage"
        );
        return;
      }
      let items = JSON.parse(JSON.stringify(boards));
      if (!items[boardIndex].tiles) {
        items[boardIndex].tiles = [];
      }
      items[boardIndex].tiles.push(newtile);

      localStorage.setItem("Dasify", JSON.stringify(items));
      setBoards(items);
      setTiles(items[boardIndex].tiles);

      // Update React Query cache so pages using useDashboard see the change immediately
      try {
        queryClient.setQueryData(detailKey, (oldData) => {
          // If there is existing cache, replace tiles; otherwise set minimal shape from local storage
          if (oldData) {
            return {
              ...oldData,
              tiles: items[boardIndex].tiles,
            };
          }
          return {
            _id: items[boardIndex]._id,
            name: items[boardIndex].name || "",
            tiles: items[boardIndex].tiles,
            pods: items[boardIndex].pods || [],
          };
        });
      } catch (e) {
        console.warn("Failed to update query cache for local board", e);
      }
    }
  };

  const addBoard = () => {
    const boardsLength = boards.length;
    setShowDashboardModel(false);
    let payload;
    if (dbUser) {
      if (isAdmin) {
        payload = {
          name: dashBoardName,
          userId: dbUser._id,
          hasAdminAdded: true,
        };
      } else {
        payload = {
          name: dashBoardName,
          userId: dbUser._id,
        };
      }
      axios.post("/api/dashboard/addDashboard", payload).then((res) => {
        const newBoard = res.data;
        const defTile = {
          dashboardId: newBoard._id,
          width: `${600}px`,
          height: `${200}px`,
          x: 25,
          y: 25,
          titleX: 1,
          titleY: 2,
          action: "textEditor",
          displayTitle: true,
          backgroundAction: "color",
          tileText: `<h4 style="line-height: 2;">Hey there! I'm the first box on your board.<br>Move me around, or go to my settings to give me a personality!<br>And if you wanrt more of me, click the + button in the boards menu.</h4><p isspaced="false" isbordered="false" isneon="false" class="" style="line-height: 2;"></p>`
        }

        axios
        .post("/api/tile/tile", defTile)
        .then((res) => {
          // Replace temporary block with real one
          setTiles((prevTiles) => [...prevTiles, res.data]);
          newBoard.tiles = [res.data]
          setBoards((prev) => [newBoard, ...prev]);
        })

        // ensure React Query lists/cache reflect the newly created board for other contexts
        try {
          queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() });
          queryClient.setQueryData(
            dashboardKeys.detail(newBoard._id),
            newBoard
          );
        } catch (e) {
          console.warn(
            "Failed to update query cache after creating dashboard",
            e
          );
        }
        router.push(`/dashboard/${newBoard._id}`);
      });
    } else {
      const boardId = uuidv4()
      const defTile = {
        dashboardId: boardId,
        width: `${600}px`,
        height: `${200}px`,
        x: 25,
        y: 25,
        titleX: 1,
        titleY: 2,
        action: "textEditor",
        displayTitle: true,
        backgroundAction: "color",
        tileText: `<h4 style="line-height: 2;">Hey there! I'm the first box on your board.<br>Move me around, or go to my settings to give me a personality!<br>And if you wanrt more of me, click the + button in the boards menu.</h4><p isspaced="false" isbordered="false" isneon="false" class="" style="line-height: 2;"></p>`
      }
      payload = {
        _id: boardId,
        name: dashBoardName,
        tiles: [defTile],
      };
      let items = boards;
      items = [payload, ...items];
      localStorage.setItem("Dasify", JSON.stringify(items));
      setBoards(items);
      setTiles([defTile]);
      router.push(`/dashboard/${payload._id}`);
    }
  };

  const selectBoard = (dashboardId) => {
    router.push(`/dashboard/${dashboardId}`);
  };

  const updatedDashBoard = () => {
    setShowDashboardModel(false);
    const data = {
      name: dashBoardName,
    };
    if (dbUser) {
      axios.patch(`/api/dashboard/${selectedDashboard}`, data).then((res) => {
        if (res) {
          const updatedList = boards.map((board) => {
            if (board._id === res.data._id) {
              return res.data;
            }
            return board;
          });
          setBoards(updatedList);
        }
      });
    } else {
      let items = boards;
      let boardIndex = items.findIndex((obj) => obj._id === selectedDashboard);
      let item = items[boardIndex];
      item = { ...item, name: dashBoardName };
      items[boardIndex] = item;
      localStorage.setItem("Dasify", JSON.stringify(items));
    }
  };

  const changeDashboardName = (e) => {
    setDashBoardName(e.target.value);
  };

  const setBoardPosition = (list) => {
    if (dbUser) {
      setBoards(list);
      let listArray = list.map((item, index) => {
        return { position: index + 1, _id: item._id };
      });
      if (list.length > 1) {
        axios.patch("/api/dashboard/addDashboard", listArray).then((res) => {});
      }
    } else {
      if (list.length > 1) {
        setBoards(list);
        localStorage.setItem("Dasify", JSON.stringify(list));
      }
    }
  };

  const deleteDashboard = (id, index) => {
    let isLastIndex = index == boards.length - 1 ? true : false;
    if (dbUser) {
      axios
        .delete(`/api/dashboard/${id}`)
        .then((res) => {
          if (res && (res.status === 200 || res.status === 204 || res.data)) {
            // remove immutably so React re-renders (coerce ids to strings)
            const newBoards = (boards || []).filter(
              (b) => String(b._id) !== String(id)
            );
            setBoards(newBoards);

            // update react-query cache and ensure UI re-renders
            try {
              queryClient.removeQueries({ queryKey: dashboardKeys.detail(id) });
              queryClient.invalidateQueries({
                queryKey: dashboardKeys.lists(),
              });
            } catch (e) {
              console.warn("Failed to update query cache after delete", e);
            }

            // (already removed above) no-op here

            // refresh authoritative list from server to ensure consistency
            if (dbUser && dbUser._id) {
              axios
                .get(
                  `/api/dashboard/addDashboard/?id=${
                    dbUser._id
                  }&t=${Date.now()}`
                )
                .then((resp) => {
                  if (resp && Array.isArray(resp.data)) setBoards(resp.data);
                })
                .catch((e) =>
                  console.warn("Failed to refresh boards after delete", e)
                );
            }

            setDash(isLastIndex, index);
          } else {
            console.warn(
              "Delete dashboard responded with unexpected status",
              res && res.status
            );
          }
        })
        .catch((err) => {
          console.error("Failed to delete dashboard:", err);
        });
    } else {
      let items = boards;
      items.splice(index, 1);
      setBoards(items);
      localStorage.setItem("Dasify", JSON.stringify(items));
      setDash(isLastIndex, index);
    }
    setOpenDashDeleteModel(false);
    setSelectedDashIndex(null);
  };

  const setDash = (isLastIndex, index) => {
    if (isLastIndex && index === 0) {
      router.push("/dashboard");
    } else {
      isLastIndex
        ? selectBoard(boards[index - 1]._id)
        : selectBoard(boards[index]._id);
    }
  };

  const handlePicClick = (event) => {
    setAnchorEl(event.currentTarget);
    navigator.clipboard.writeText(window.location.href);
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(location.href);
    setIsCopied(true);
  }

  const duplicateBoard = (currentBoard) => {
    if (dbUser) {
      const newBoard = { ...currentBoard };
      axios.post("/api/dashboard/duplicateDashboard", newBoard).then((res) => {
        setBoards([...boards, res.data]);
      });
    } else {
      const newBoard = { ...currentBoard, _id: uuidv4() };
      setBoards([...boards, newBoard]);
      localStorage.setItem("Dasify", JSON.stringify([...boards, newBoard]));
    }
  };

  return (
    <Box>
      <AppBar
        position="relative"
        color="transparent"
        sx={{
          zIndex: (theme) => {
            return theme.zIndex.drawer + 1;
          },
          backgroundColor: "#FFFFFF",
          width: headerwidth,
        }}
      >
        <CssBaseline />
        <Toolbar>
          <Grid
            container
            display="flex"
            justifyContent="space-between"
            className="header_container"
          >
            <Grid item className="left_content">
              <div className="add_tiles" onClick={addTiles}>
                <AddSharpIcon />
              </div>
              <div className="vertical"></div>
              <div className="board_nav">
                <ReactSortable
                  ref={divRef}
                  filter=".dashboard_btn"
                  dragClass="sortableDrag"
                  list={boards}
                  setList={(list) => setBoardPosition(list)}
                  animation="200"
                  easing="ease-out"
                  className="dashboard_drag"
                  key={(boards || []).map((b) => String(b._id)).join(",")}
                >
                  {boards.map((board, index) => {
                    return (
                      <List key={board._id} sx={{ p: 0, m: "0 4px" }}>
                        <ListItem
                          button
                          onClick={() => selectBoard(board._id)}
                          onMouseEnter={() => setShowIcon(board._id)}
                          onMouseLeave={() => setShowIcon(null)}
                          onTouchStart={(e) => {
                            if (isDblTouchTap(e)) {
                              selectBoard(board._id);
                            }
                          }}
                          selected={board._id === currentActiveBoard}
                          sx={{
                            borderRadius: "4px",
                            padding: "8px 12px",
                            "&.Mui-selected": {
                              backgroundColor: "rgba(69, 129, 142, 0.1)",
                              "&:hover": {
                                backgroundColor: "rgba(69, 129, 142, 0.15)",
                              },
                              "& .MuiListItemText-primary": {
                                fontWeight: "bold",
                                color: "#45818e",
                              },
                            },
                            "&:not(.Mui-selected):hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.04)",
                            },
                          }}
                        >
                          <ListItemText primary={board.name} />

                          {showIcon === board._id && (
                            <span
                              className="cross"
                              onClick={(e) => {
                                e.stopPropagation();
                                options
                                  ? setOptions(null)
                                  : setOptions(e.currentTarget);
                              }}
                            >
                              <KeyboardArrowDownIcon fontSize="small" />
                              <Menu
                                anchorEl={options}
                                open={Boolean(options)}
                                onClose={() => setOptions(null)}
                                anchorOrigin={{
                                  vertical: "bottom",
                                  horizontal: "right",
                                }}
                                transformOrigin={{
                                  vertical: "top",
                                  horizontal: "right",
                                }}
                              >
                                <MenuItem
                                  onClick={() => {
                                    setOptions(null);
                                    setOpenDashDeleteModel(true);
                                    setSelectedDashboard(board._id);
                                    setSelectedDashIndex(index);
                                  }}
                                >
                                  Delete
                                </MenuItem>
                                {dbUser && (
                                  <MenuItem
                                    onClick={() => {
                                      setOptions(null);
                                      setShareLinkModal(true);
                                      setCopiedUrl(window.location.href);
                                    }}
                                  >
                                    Share
                                  </MenuItem>
                                )}
                                <MenuItem
                                  onClick={() => {
                                    setOptions(null);
                                    setSelectedDashboard(board._id);
                                    setDashBoardName(board.name);
                                    setShowDashboardModel(true);
                                  }}
                                >
                                  Rename
                                </MenuItem>
                                <MenuItem
                                  onClick={() => {
                                    setOptions(null);
                                    duplicateBoard(board);
                                  }}
                                >
                                  Duplicate
                                </MenuItem>
                              </Menu>
                            </span>
                          )}
                        </ListItem>
                      </List>
                    );
                  })}
                </ReactSortable>
                {isOverflowing && (
                  <div className="scroll-bar">
                    <div className="vertical"></div>
                    <div className="scroll-buttons">
                      <Image
                        src={leftArrow}
                        onClick={() => handleScroll("left")}
                      />
                      <Image
                        src={rightArrow}
                        onClick={() => handleScroll("right")}
                      />
                    </div>
                    <div className="vertical"></div>
                  </div>
                )}
              </div>
              <Button
                className="dashboard_btn"
                sx={{ p: "11px" }}
                onClick={() => {
                  setShowDashboardModel(true);
                  setSelectedDashboard(null);
                  setDashBoardName("");
                }}
              >
                + New
              </Button>
            </Grid>
            <Grid item className="right_header">
              <Image className="logo" src={logo} alt="Boardzy logo" priority />
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                className="menu-button"
                onClick={toggleDrawer}
              >
                <MenuIcon sx={{ color: "#45818e" }} />
              </IconButton>
              {user ? (
                <div>
                  <Button onClick={(e) => handlePicClick(e)}>
                    <Avatar src={user.picture}></Avatar>
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => {
                      setAnchorEl(null);
                    }}
                  >
                    <div className="email">{user.email}</div>
                    <div className="horizonLine"></div>
                    <div className="logout">
                      <Link href="/api/auth/logout">Log out</Link>
                    </div>
                  </Menu>
                </div>
              ) : (
                <div>
                  <Link
                    href="/api/auth/login"
                    prefetch={false}
                    className="sign_btn"
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/api/auth/login"
                    prefetch={false}
                    className="login_btn"
                  >
                    Login
                  </Link>
                </div>
              )}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <SideDrawer open={isDrawerOpen} close={toggleDrawer} user={dbUser} />

      {}
      <Dialog open={openDashDeleteModel} className="model">
        <DialogTitle sx={{ width: "270px" }}>
          Are you sure you want to delete?
        </DialogTitle>
        <DialogActions>
          <Button
            className="button_cancel"
            sx={{ color: "#63899e" }}
            onClick={() => {
              setOpenDashDeleteModel(false), setSelectedDashIndex(null);
            }}
          >
            Cancel
          </Button>
          <Button
            className="button_filled"
            sx={{
              background: "#63899e",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#63899e",
              },
            }}
            onClick={() => {
              deleteDashboard(selectedDashboard, selectedDashIndex);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {}
      <Dialog open={showDeshboardModel}>
        <DialogTitle>
          {selectedDashboard ? "Update Dashboard" : "Add Dashboard"}
        </DialogTitle>
        <DialogContent sx={{ width: "300px" }}>
          <input
            type="text"
            value={dashBoardName}
            placeholder="Enter Dashboard Name"
            onChange={changeDashboardName}
            style={{ height: "40px", width: "100%" }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            className="button_cancel"
            sx={{ color: "#63899e" }}
            onClick={() => setShowDashboardModel(false)}
          >
            Cancel
          </Button>
          {selectedDashboard ? (
            <Button
              className="button_filled"
              sx={{
                background: "#63899e",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#63899e",
                },
              }}
              onClick={() => {
                updatedDashBoard();
              }}
            >
              Save
            </Button>
          ) : (
            <Button
              className="button_filled"
              sx={{
                background: "#63899e",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#63899e",
                },
              }}
              onClick={() => {
                addBoard();
              }}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {}
      <Dialog open={shareLinkModal}>
        <DialogContent>
          <div className="copiedUrl-content">
            <p>{copiedUrl}</p>
          </div>
        </DialogContent>
        <DialogActions>
          {isCopied ? (
            <Button disabled>Copied</Button>
          ) : (
            <Button onClick={() => handleCopy()}>Copy</Button>
          )}
          <Button
            onClick={() => {
              setShareLinkModal(false);
              setIsCopied(false);
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Header;
