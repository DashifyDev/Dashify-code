"use client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { globalContext } from "@/context/globalContext";
import useAdmin from "@/hooks/isAdmin";
import { dashboardKeys } from "@/hooks/useDashboard";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { safeSetItem } from "@/utils/safeLocalStorage";
import { isUserPro, FREE_PLAN_MAX_BOARDS, FREE_PLAN_MAX_TILES_PER_BOARD } from "@/constants/plans";
import LimitReachedModal from "@/components/LimitReachedModal";

function Library() {
  const [library, setLibrary] = useState([]);
  const [originalLibrary, setOriginalLibrary] = useState([]);
  const [noSearchResult, setNoSearchResult] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("mostPopular");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingBoardId, setLoadingBoardId] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState(null); // 'board' | 'tile' | null
  const { dbUser, setBoards, boards, setTiles } = useContext(globalContext);
  const isPro = isUserPro(dbUser);
  const queryClient = useQueryClient();
  const isAdmin = useAdmin();
  const router = useRouter();

  const filterOption = [
    { id: "mostPopular", filter: "Most Popular" },
    { id: "newest", filter: "Newest" },
    { id: "aToz", filter: "A-to-Z" },
  ];

  const typeOptions = [
    { id: "all", label: "All" },
    { id: "community", label: "Community" },
    { id: "premium", label: "Premium" },
  ];

  useEffect(() => {
    axios.get(`/api/template/addTemplate?filter=${selectedFilter}&type=${typeFilter}`).then(res => {
      setOriginalLibrary(res.data);
      setLibrary(res.data);
      setNoSearchResult(false);
    });
  }, [selectedFilter, typeFilter]);

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

  const selectFilter = id => {
    setSelectedFilter(id);
  };

  const selectType = id => {
    setTypeFilter(id);
  };

  var handleSearch = event => {
    let searchValue = event.target.value.toLowerCase();
    if (searchValue == "") {
      setLibrary(originalLibrary);
      setNoSearchResult(false);
    } else {
      const result = originalLibrary.filter(item =>
        item.boardName.toLowerCase().includes(searchValue)
      );
      const keywordsSearch = originalLibrary
        .map(item => ({
          ...item,
          keywords: item.keywords.filter(item => item.toLowerCase().includes(searchValue)),
        }))
        .filter(elements => elements.keywords.length > 0);
      if (result.length) {
        setLibrary(result);
      } else if (keywordsSearch.length) {
        setLibrary(keywordsSearch);
      } else {
        setNoSearchResult(true);
      }
    }
  };

  const redirectToUser = link => {
    window.open(link, "_blank");
  };

  const handleBoardClick = async data => {
    if (data.isPremium && !isPro) {
      setShowPremiumModal(true);
      return;
    }
    if (dbUser && !isPro && boards.length >= FREE_PLAN_MAX_BOARDS) {
      setLimitModalType("board");
      return;
    }

    const boardId = data.boardLink.split("/").pop();
    setLoadingBoardId(boardId);

    try {
      const response = await axios.get(`/api/dashboard/${boardId}`);
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
          .then(res => {
            const newBoard = res.data;

            const boardTiles = response.data.tiles.map(el => {
              const tileCopy = { ...el };
              delete tileCopy._id;
              tileCopy.dashboardId = newBoard._id;
              return tileCopy;
            });

            axios
              .post("/api/tile/tiles", {
                dashboardId: newBoard._id,
                tiles: boardTiles,
              })
              .then(resp => {
                setTiles(resp.data.tiles);
                newBoard.tiles = resp.data.tiles;
                setBoards(prev => [...prev, newBoard]);

                try {
                  queryClient.invalidateQueries({
                    queryKey: dashboardKeys.lists(),
                  });
                  queryClient.setQueryData(dashboardKeys.detail(newBoard._id), newBoard);
                } catch (e) {
                  console.warn("Failed to update query cache after creating dashboard", e);
                }
                setLoadingBoardId(null);
                router.push(`/dashboard/${newBoard._id}`);
              })
              .catch(err => {
                setLoadingBoardId(null);
                if (err.response?.status === 403) setLimitModalType("tile");
                else console.error("Error creating tiles:", err);
              });
          })
          .catch(err => {
            setLoadingBoardId(null);
            if (err.response?.status === 403) setLimitModalType("board");
            else console.error("Error creating dashboard:", err);
          });
      } else {
        const boardId = uuidv4();
        const newTiles = response.data.tiles.map(tile => {
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
        safeSetItem("Dasify", JSON.stringify(items));
        setBoards(items);
        setTiles(newTiles);

        try {
          const detailKey = dashboardKeys.detail(boardId);
          queryClient.setQueryData(detailKey, oldData => {
            if (oldData) {
              return {
                ...oldData,
                tiles: payload.tiles,
              };
            }
            return {
              _id: payload._id,
              name: payload.name || "",
              tiles: payload.tiles,
              pods: payload.pods || [],
            };
          });
        } catch (e) {
          console.warn("Failed to update query cache for local board", e);
        }

        setLoadingBoardId(null);
        router.push(`/dashboard/${boardId}`);
      }
    } catch (error) {
      console.error("Error loading board:", error);
      setLoadingBoardId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#63899e] mb-2">
            Boards Library
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Discover and add beautiful dashboard templates to your Boardzy
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block">
                Filter:
              </span>
              <div className="inline-flex items-center rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 gap-1.5 shadow-inner border border-gray-200/50">
                {filterOption.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => selectFilter(filter.id)}
                    className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:ring-offset-2 ${
                      selectedFilter === filter.id
                        ? "bg-gradient-to-r from-[#63899e] to-[#4a6d7e] text-white shadow-lg shadow-[#63899e]/30 scale-105"
                        : "text-gray-600 hover:text-[#63899e] hover:bg-white/60 active:scale-95"
                    }`}
                  >
                    {selectedFilter === filter.id && (
                      <span className="absolute inset-0 rounded-lg bg-white/20 animate-pulse" />
                    )}
                    <span className="relative z-10">{filter.filter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block">
                Search:
              </span>
              <div className="relative flex-1 lg:flex-initial lg:w-64">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#63899e] pointer-events-none z-10">
                  <svg
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Search boards..."
                  onChange={handleSearch}
                  className="pl-10 pr-4 h-10 w-full bg-white border-gray-300 rounded-lg shadow-sm hover:shadow-md focus:shadow-md focus:border-[#63899e] transition-all duration-200 text-sm placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Type - same style as Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap hidden sm:block">
              Type:
            </span>
            <div className="inline-flex items-center rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 gap-1.5 shadow-inner border border-gray-200/50">
              {typeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => selectType(opt.id)}
                  className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:ring-offset-2 ${
                    typeFilter === opt.id
                      ? "bg-gradient-to-r from-[#63899e] to-[#4a6d7e] text-white shadow-lg shadow-[#63899e]/30 scale-105"
                      : "text-gray-600 hover:text-[#63899e] hover:bg-white/60 active:scale-95"
                  }`}
                >
                  {typeFilter === opt.id && (
                    <span className="absolute inset-0 rounded-lg bg-white/20 animate-pulse" />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Board Cards Grid */}
        {noSearchResult ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mb-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12">
            {library.map((data, index) => {
              const boardId = data.boardLink.split("/").pop();
              const isLoading = loadingBoardId === boardId;

              return (
                <Card
                  key={index}
                  className="group cursor-pointer overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 bg-white/95 backdrop-blur-sm"
                  style={{ border: "1px solid #e5e7eb" }}
                  onClick={() => handleBoardClick(data)}
                >
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
                      <LoadingSpinner size="medium" text="Loading board..." />
                    </div>
                  )}
                  <CardTitle className="text-xl sm:text-2xl line-clamp-2 group-hover:text-[#4a6d7e] transition-colors px-4">
                    {data.boardName}
                  </CardTitle>
                  {/* Image - blurred with big lock when premium */}
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent z-10" />
                    <Image
                      src={data.boardImage}
                      alt={data.boardName || "board-image"}
                      fill
                      className={`object-cover transition-all duration-300 ${
                        data.isPremium ? "blur-md scale-105" : "group-hover:scale-110"
                      }`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {data.isPremium && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/40">
                        <svg
                          className="w-16 h-16 sm:w-20 sm:h-20 text-white drop-shadow-lg flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0v2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="mt-2 text-sm font-bold text-white uppercase tracking-wide drop-shadow">
                          Pro
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardHeader className="pb-4">
                    <CardDescription className="text-sm sm:text-base line-clamp-3 mt-2 text-gray-600">
                      {data.boardDescription}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Keywords */}
                    <div className="flex flex-wrap gap-2">
                      {data.keywords.slice(0, 4).map((keyword, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 border border-gray-200/50 transition-colors"
                        >
                          {keyword}
                        </Badge>
                      ))}
                      {data.keywords.length > 4 && (
                        <Badge variant="outline" className="text-xs border-gray-300/60">
                          +{data.keywords.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showPremiumModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPremiumModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">Premium Template</h3>
            <p className="text-gray-600 mb-6">Upgrade to Pro to use premium templates.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPremiumModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPremiumModal(false);
                  router.push("/subscription");
                }}
              >
                View Plans
              </Button>
            </div>
          </div>
        </div>
      )}

      <LimitReachedModal
        type="board"
        limit={FREE_PLAN_MAX_BOARDS}
        open={limitModalType === "board"}
        onClose={() => setLimitModalType(null)}
      />
      <LimitReachedModal
        type="tile"
        limit={FREE_PLAN_MAX_TILES_PER_BOARD}
        open={limitModalType === "tile"}
        onClose={() => setLimitModalType(null)}
      />
    </div>
  );
}

export default Library;
