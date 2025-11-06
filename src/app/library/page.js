"use client";
import React, { useEffect, useState, useContext } from "react";
import { globalContext } from "@/context/globalContext";
import { useRouter } from "next/navigation";
import "./library.css";
import axios from "axios";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import useAdmin from "@/hooks/isAdmin";
import { dashboardKeys } from "@/hooks/useDashboard";
import { v4 as uuidv4 } from "uuid";

function Library() {
  const [library, setLibrary] = useState([]);
  const [originalLibrary, setOriginalLibrary] = useState([]);
  const [noSearchResult, setNoSearchResult] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("mostPopular");
  const { dbUser, setBoards, boards, setTiles } = useContext(globalContext);
  const queryClient = useQueryClient();
  const isAdmin = useAdmin();
  const router = useRouter();

  const filterOption = [
    { id: "mostPopular", filter: "Most Popular" },
    { id: "newest", filter: "Newest" },
    { id: "aToz", filter: "A-to-Z" },
  ];

  useEffect(() => {
    axios
      .get(`/api/template/addTemplate?filter=${selectedFilter}`)
      .then((res) => {
        setOriginalLibrary(res.data);
        setLibrary(res.data);
      });
  }, []);

  // useEffect(() => {
  //   (async () => {
  //     console.log("boards", boards)
  //     console.log("library", library)
  //     if (boards && boards.length > 0 && library && library.length > 0) {
  //     // 6504db17947e478445e2ccee
  //     // 650763be47114b00ebe9dde8

  //     const travel = boards.find(el => el.name === "Travel")
  //     const responseTravel = await fetch(`/api/dashboard/${travel._id}`).then(res => res.json())
  //     const kids = boards.find(el => el.name === "Davi")
  //     const responseKids = await fetch(`/api/dashboard/${kids._id}`).then(res => res.json())

  //     console.log("responseTravel", responseTravel)
  //     console.log("responseKids", responseKids)

  //     // const res1 = await axios.post("/api/tile/tiles", { dashboardId: "6504db17947e478445e2ccee", tiles: responseTravel.tiles })
  //     // console.log("res1", res1)
  //     // const res2 = await axios.post("/api/tile/tiles", { dashboardId: "650763be47114b00ebe9dde8", tiles: responseKids.tiles })
  //     // console.log("res2", res2)
  //     }
  //   })()
  // }, [boards, library])

  const selectFilter = async (id) => {
    setSelectedFilter(id);
    const result = await axios.get(`/api/template/addTemplate?filter=${id}`);
    setLibrary(result.data);
  };

  var handleSearch = (event) => {
    let searchValue = event.target.value.toLowerCase();
    if (searchValue == "") {
      setLibrary(originalLibrary);
      setNoSearchResult(false);
    } else {
      const result = originalLibrary.filter((item) =>
        item.boardName.toLowerCase().includes(searchValue),
      );
      const keywordsSearch = originalLibrary
        .map((item) => ({
          ...item,
          keywords: item.keywords.filter((item) =>
            item.toLowerCase().includes(searchValue),
          ),
        }))
        .filter((elements) => elements.keywords.length > 0);
      if (result.length) {
        setLibrary(result);
      } else if (keywordsSearch.length) {
        setLibrary(keywordsSearch);
      } else {
        setNoSearchResult(true);
      }
    }
  };

  const redirectToUser = (link) => {
    window.open(link, "_blank");
  };

  return (
    <div className="library">
      <div className="library-board-heading">
        <h1>Boards Library</h1>
      </div>
      <div className="library-body">
        <div className="library-Style-Filter">
          <h2>
            <span className="paraStyle">FILTER:</span>
            {filterOption.map((filter, index) => (
              <span
                onClick={() => {
                  selectFilter(filter.id);
                }}
                key={filter.id}
                style={{
                  fontWeight: selectedFilter === filter.id ? 700 : 200,
                  textDecoration:
                    selectedFilter === filter.id ? "underline" : "none",
                  marginLeft: "5px",
                  cursor: "pointer",
                }}
              >
                {filter.filter}
              </span>
            ))}
          </h2>
          <h2>
            <span className="paraStyle">
              SEARCH:
              <input
                className="input-style"
                placeholder="Search Boards"
                onChange={(e) => {
                  handleSearch(e);
                }}
              />
            </span>
          </h2>
        </div>
        <div className="lib_container">
          {noSearchResult ? (
            <div>
              <hr />
              <div>
                <h3>No Result Found</h3>
              </div>
            </div>
          ) : (
            <>
              {library.map((data, index) => {
                return (
                  <div key={index}>
                    <hr />
                    <div
                      className="filter-result"
                      onClick={async () => {
                        const response = await axios.get(
                          `/api/dashboard/${data.boardLink.split("/").pop()}`,
                        );
                        let payload;
                        if (dbUser) {
                          if (isAdmin) {
                            payload = {
                              name: response.data.name,
                              userId: dbUser._id,
                              hasAdminAdded: true,
                            };
                          } else {
                            payload = {
                              name: response.data.name,
                              userId: dbUser._id,
                            };
                          }
                          axios
                            .post("/api/dashboard/addDashboard", payload)
                            .then((res) => {
                              const newBoard = res.data;

                              const boardTiles = response.data.tiles.map(
                                (el) => {
                                  const tileCopy = { ...el };
                                  delete tileCopy._id;
                                  tileCopy.dashboardId = newBoard._id;
                                  return tileCopy;
                                },
                              );

                              axios
                                .post("/api/tile/tiles", {
                                  dashboardId: newBoard._id,
                                  tiles: boardTiles,
                                })
                                .then((resp) => {
                                  setTiles(resp.data.tiles);
                                  newBoard.tiles = resp.data.tiles;
                                  setBoards((prev) => [...prev, newBoard]);

                                  try {
                                    queryClient.invalidateQueries({
                                      queryKey: dashboardKeys.lists(),
                                    });
                                    queryClient.setQueryData(
                                      dashboardKeys.detail(newBoard._id),
                                      newBoard,
                                    );
                                  } catch (e) {
                                    console.warn(
                                      "Failed to update query cache after creating dashboard",
                                      e,
                                    );
                                  }
                                  router.push(`/dashboard/${newBoard._id}`);
                                });
                            });
                        } else {
                          const boardId = uuidv4();
                          const newTiles = response.data.tiles.map((tile) => {
                            tile._id = uuidv4();
                            tile.dashboardId = boardId;
                            return tile;
                          });
                          let payload = {
                            _id: boardId,
                            name: response.data.name,
                            tiles: newTiles,
                          };
                          let items = boards;
                          items = [...items, payload];
                          localStorage.setItem("Dasify", JSON.stringify(items));
                          setBoards(items);
                          setTiles(newTiles);

                          try {
                            const detailKey = dashboardKeys.detail(
                              newBoard._id,
                            );
                            queryClient.setQueryData(detailKey, (oldData) => {
                              if (oldData) {
                                return {
                                  ...oldData,
                                  tiles: items[newBoard._id].tiles,
                                };
                              }
                              return {
                                _id: items[newBoard._id]._id,
                                name: items[newBoard._id].name || "",
                                tiles: items[newBoard._id].tiles,
                                pods: items[newBoard._id].pods || [],
                              };
                            });
                          } catch (e) {
                            console.warn(
                              "Failed to update query cache for local board",
                              e,
                            );
                          }

                          router.push(`/dashboard/${boardId}`);
                        }
                      }}
                    >
                      <Image
                        src={data.boardImage}
                        alt={data.boardName || "board-image"}
                        width={150}
                        height={90}
                        className="filter-image"
                        style={{ objectFit: "cover" }}
                      />
                      <div className="board-details">
                        <h2 className="paraStyle1">{data.boardName}</h2>
                        <p>{data.boardDescription}</p>
                        <small>
                          <span className="paraStyle">Keywords: </span>
                          {data.keywords.join(",")}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Library;
