"use client";
import UserMenu from "@/components/UserMenu";
import SideDrawer from "@/components/SideDrawer";
import { globalContext } from "@/context/globalContext";
import useAdmin from "@/hooks/isAdmin";
import useIsMobile from "@/hooks/useIsMobile";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import Link from "next/link";
import { useContext, useState } from "react";
import logo from "../../assets/logo.png";

function LibraryHeader() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { dbUser } = useContext(globalContext);
  const isMobile = useIsMobile();
  const isAdmin = useAdmin();
  const { user, isLoading: authLoading } = useUser();

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm sm:text-base font-medium text-gray-700 hidden md:block">
              Click on a board below to add to your Boardzy!
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard" prefetch={false} className="flex items-center">
              <Image src={logo} alt="Boardzy logo" priority className="h-8 w-auto sm:h-10" />
            </Link>

            <button
              onClick={toggleDrawer}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#63899e] hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 transition-all duration-200 border-0 outline-none"
              aria-label="Open menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <UserMenu
              dbUser={dbUser}
              isMobile={isMobile}
              authLoading={authLoading}
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
    </header>
  );
}

export default LibraryHeader;
