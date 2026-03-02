"use client";
import { globalContext } from "@/context/globalContext";
import { FREE_PLAN_MAX_BOARDS, FREE_PLAN_MAX_TILES_PER_BOARD } from "@/constants/plans";
import useIsMobile from "@/hooks/useIsMobile";
import { useBoardOperations } from "@/hooks/useBoardOperations";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import LimitReachedModal from "../LimitReachedModal";
import SideDrawer from "../SideDrawer";
import AddContentMenu from "./AddContentMenu";
import AddUpdateBoardModal from "./AddUpdateBoardModal";
import BoardOptionsMenu from "./BoardOptionsMenu";
import DeleteBoardModal from "./DeleteBoardModal";
import ShareLinkModal from "./ShareLinkModal";
import BoardTabsNav from "./BoardTabsNav";
import MobileBoardMenu from "./MobileBoardMenu";
import UserMenu from "@/components/UserMenu";
import useAdmin from "@/hooks/isAdmin";

function Header() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [openDashDeleteModel, setOpenDashDeleteModel] = useState(false);
  const [showDashboardModal, setShowDashboardModel] = useState(false);
  const [options, setOptions] = useState(null);
  const { isLoading, user } = useUser();
  const {
    dbUser,
    activeBoard,
    setActiveBoard,
    boards,
    headerwidth,
  } = useContext(globalContext);
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [boardMenuAnchor, setBoardMenuAnchor] = useState(null);
  const [addTilesMenuAnchor, setAddTilesMenuAnchor] = useState(null);
  const [shareLinkModal, setShareLinkModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const isAdmin = useAdmin();

  const currentActiveBoard = id || activeBoard;

  const {
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
    addBoard,
    addTiles,
    updatedDashBoard,
    deleteDashboard,
    setBoardPosition,
    duplicateBoard,
    changeDashboardName,
    selectBoard,
  } = useBoardOperations({ id, setShowDashboardModel });

  useEffect(() => {
    if (id && id !== activeBoard) {
      setActiveBoard(id);
    }
  }, [id, activeBoard, setActiveBoard]);

  async function handleCopy() {
    await navigator.clipboard.writeText(location.href);
    setIsCopied(true);
  }

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full max-w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm py-2"
      style={{ width: headerwidth, maxWidth: "100%" }}
    >
      <div className="w-full px-2 sm:px-4 lg:px-6 max-w-full">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 min-w-0 max-w-full">
          {/* Left Section */}
          <div
            className={`flex items-center min-w-0 max-w-full ${
              isMobile ? "flex-1 justify-between" : "gap-4 flex-1"
            }`}
          >
            {/* Add Tiles Button */}
            <div className="relative">
              <button
                onClick={e => setAddTilesMenuAnchor(e.currentTarget)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#63899e] text-white hover:bg-[#4a6d7e] transition-all duration-200 shadow-sm hover:shadow-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2"
                aria-label="Add tile or board"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              {/* Add Tiles Dropdown Menu */}
              <AddContentMenu
                anchor={addTilesMenuAnchor}
                onClose={() => setAddTilesMenuAnchor(null)}
                onAddTile={() => addTiles()}
                onAddBoard={() => {
                  setShowDashboardModel(true);
                  setSelectedDashboard(null);
                  setDashBoardName("");
                }}
              />
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2 sm:mx-4" />

            {isMobile ? (
              <>
                {/* Mobile: Logo and Board Selector */}
                <div className="flex flex-col items-center flex-1 justify-center gap-1 min-w-0 max-w-full">
                  <Image
                    src={logo}
                    alt="Boardzy logo"
                    priority
                    className="h-5 w-auto flex-shrink-0"
                  />
                  <button
                    onClick={e => setBoardMenuAnchor(e.currentTarget)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#538a95] text-sm font-medium transition-colors min-w-[140px] max-w-[220px] border-0 outline-none flex-shrink-0"
                  >
                    <span className="truncate min-w-0">
                      {boards.find(b => b._id === currentActiveBoard)?.name || "Select Board"}
                    </span>
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                {/* Mobile Board Menu */}
                <MobileBoardMenu
                  anchor={boardMenuAnchor}
                  boards={boards}
                  activeBoard={currentActiveBoard}
                  onSelectBoard={boardId => {
                    setBoardMenuAnchor(null);
                    selectBoard(boardId);
                  }}
                  onAddBoard={() => {
                    setBoardMenuAnchor(null);
                    setShowDashboardModel(true);
                    setSelectedDashboard(null);
                    setDashBoardName("");
                  }}
                  onShowOptions={(board, index, el) => {
                    if (options === el) {
                      setOptions(null);
                    } else {
                      setOptions(el);
                      setSelectedDashboard(board._id);
                      setSelectedDashIndex(index);
                    }
                  }}
                  onReorder={list => setBoardPosition(list)}
                  onClose={() => setBoardMenuAnchor(null)}
                />

              </>
            ) : (
              /* Desktop: Boards Navigation with Horizontal Scroll */
              <BoardTabsNav
                boards={boards}
                activeBoard={currentActiveBoard}
                onSelectBoard={selectBoard}
                onShowOptions={(board, index, el) => {
                  if (options === el) {
                    setOptions(null);
                  } else {
                    setOptions(el);
                    setSelectedDashboard(board._id);
                    setSelectedDashIndex(index);
                  }
                }}
                onReorder={list => setBoardPosition(list)}
              />
            )}
            <BoardOptionsMenu
              anchor={options}
              isMobile={isMobile}
              dbUser={dbUser}
              onClose={() => setOptions(null)}
              onShare={() => {
                setOptions(null);
                setCopiedUrl(window.location.href);
                setShareLinkModal(true);
              }}
              onRename={() => {
                setOptions(null);
                const board = boards.find(b => b._id === selectedDashboard);
                if (board) {
                  setDashBoardName(board.name);
                  setShowDashboardModel(true);
                }
              }}
              onDuplicate={() => {
                setOptions(null);
                const board = boards.find(b => b._id === selectedDashboard);
                if (board) {
                  duplicateBoard(board);
                }
              }}
              onDelete={() => {
                setOptions(null);
                setOpenDashDeleteModel(true);
              }}
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Logo (Desktop only) */}
            {!isMobile && (
              <Image src={logo} alt="Boardzy logo" priority className="h-8 w-auto flex-shrink-0" />
            )}

            {/* Menu Button */}
            <button
              onClick={toggleDrawer}
              className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-[#45818e] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 transition-all duration-200 border-0 outline-none"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* User Menu or Auth Buttons */}
            <UserMenu
              dbUser={dbUser}
              isMobile={isMobile}
              authLoading={isLoading}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
      <SideDrawer
        open={isDrawerOpen}
        close={toggleDrawer}
        user={dbUser}
        isMobile={isMobile}
        authUser={user}
      />

      {/* Delete Dashboard Modal */}
      <DeleteBoardModal
        open={openDashDeleteModel}
        onConfirm={() => {
          setOpenDashDeleteModel(false);
          deleteDashboard(selectedDashboard, selectedDashIndex);
        }}
        onCancel={() => {
          setOpenDashDeleteModel(false);
          setSelectedDashIndex(null);
        }}
      />

      {/* Add/Update Dashboard Modal */}
      <AddUpdateBoardModal
        open={showDashboardModal}
        mode={selectedDashboard ? "update" : "add"}
        name={dashBoardName}
        onNameChange={changeDashboardName}
        onConfirm={selectedDashboard ? updatedDashBoard : addBoard}
        onCancel={() => {
          setShowDashboardModel(false);
          setDashBoardName("");
          setSelectedDashboard(null);
        }}
      />

      {/* Share Link Modal */}
      <ShareLinkModal
        open={shareLinkModal}
        url={copiedUrl}
        isCopied={isCopied}
        onCopy={handleCopy}
        onClose={() => {
          setShareLinkModal(false);
          setIsCopied(false);
        }}
      />

      <LimitReachedModal
        type="board"
        limit={FREE_PLAN_MAX_BOARDS}
        open={showBoardLimitModal}
        onClose={() => setShowBoardLimitModal(false)}
      />
      <LimitReachedModal
        type="tile"
        limit={FREE_PLAN_MAX_TILES_PER_BOARD}
        open={showTileLimitModal}
        onClose={() => setShowTileLimitModal(false)}
      />
    </header>
  );
}

export default Header;
