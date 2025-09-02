"use client";
import React from "react";
import Header from "@/components/Header";
import WarningPrompt from "@/components/WarningPrompt";
import { useContext } from "react";
import { globalContext } from "@/context/globalContext";

function Dashboard({ children }) {
  let { dbUser } = useContext(globalContext);

  return (
    <>
      <Header />
      {!dbUser && <WarningPrompt />}
      {children}
    </>
  );
}

export default Dashboard;
