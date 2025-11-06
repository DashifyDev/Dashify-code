import React from "react";
import LibraryHeader from "./libraryHeader";

function library({ children }) {
  return (
    <>
      <LibraryHeader />
      {children}
    </>
  );
}

export default library;
