"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import { globalContext } from "@/context/globalContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

function page() {
  const router = useRouter();
  const { boards, isBoardsLoaded } = useContext(globalContext);

  useEffect(() => {
    if (!isBoardsLoaded) return;
    if (Array.isArray(boards) && boards.length > 0) {
      router.replace(`/dashboard/${boards[0]._id}`);
    }
  }, [boards, isBoardsLoaded, router]);

  if (!isBoardsLoaded) {
    return <LoadingSpinner text="Loading dashboards..." fullScreen={true} />;
  }

  if (Array.isArray(boards) && boards.length > 0) {
    return <LoadingSpinner text="Opening dashboard..." fullScreen={true} />;
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 96px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "560px" }}>
        <h1 style={{ fontSize: "28px", color: "#2f4e5d", marginBottom: "10px" }}>No boards yet</h1>
        <p style={{ color: "#5f7380", marginBottom: "18px" }}>
          You do not have any dashboards right now. Create one from the library to get started.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/library"
            style={{
              display: "inline-block",
              backgroundColor: "#63899e",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              fontWeight: 600,
            }}
          >
            Open Library
          </Link>
          <Link
            href="/subscription"
            style={{
              display: "inline-block",
              border: "1px solid #63899e",
              color: "#63899e",
              textDecoration: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              fontWeight: 600,
            }}
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
}

export default page;
