import React from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// This page is a transitional route (/dashboard without an ID).
// The Header component handles redirecting to the first available board.
function page() {
  return <LoadingSpinner text="Loading your boards..." fullScreen={true} />;
}

export default page;
