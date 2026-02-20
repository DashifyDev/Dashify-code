"use client";
import React from "react";
import Header from "@/components/Header";
import WarningPrompt from "@/components/WarningPrompt";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useContext } from "react";
import { globalContext } from "@/context/globalContext";
import { useUser } from "@auth0/nextjs-auth0/client";

function Dashboard({ children }) {
  let { dbUser } = useContext(globalContext);
  const { user, isLoading } = useUser();

  // Show loading spinner while auth state is resolving after login/signup.
  // This prevents the blank page flash when user is authenticated by Auth0
  // but dbUser hasn't been fetched from the database yet.
  if (isLoading || (user && !dbUser)) {
    return <LoadingSpinner text="Loading your workspace..." fullScreen={true} />;
  }

  return (
    <>
      <Header />
      {!dbUser && <WarningPrompt />}
      {children}
    </>
  );
}

export default Dashboard;
