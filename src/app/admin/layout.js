"use client";
import useAdmin from "@/hooks/isAdmin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import React from 'react'

function layout({ children }) {
  const isAdmin = useAdmin();
  const route = useRouter();

  useEffect(() => {
    if (isAdmin !== null) {
      if (isAdmin) {
        route.push("/admin/board-library")
      } else {
        route.push("/dashboard")
      }
    }
  }, [route, isAdmin])
  return (
    <div>
      {children}
    </div>
  )
}

export default layout
