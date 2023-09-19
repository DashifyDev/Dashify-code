"use client";
import useAdmin from "@/hooks/isAdmin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import React from 'react'

function layout({children}) {
  const isAdmin = useAdmin();
  const route = useRouter();

  useEffect(() => {
    if (isAdmin) {
      route.push("/admin/board-library")
    } else {
      route.push("/dashboard")
    }
  }, [isAdmin])
  return (
    <div>
      {children}
    </div>
  )
}

export default layout
