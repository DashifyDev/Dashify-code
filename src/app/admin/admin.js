"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import "./admin.css";
import Image from "next/image";
import logo from "../../assets/whiteLogo.png";

function Admin() {
  const router = useRouter();

  return (
    <div className="admin">
      <div className="side_bar">
        <div className="boardzy_logo">
          <Image src={logo} alt="logo" />
        </div>
        <div className="button">
          <button onClick={() => router.push("/admin/board-library")}>
            Board Library
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;
