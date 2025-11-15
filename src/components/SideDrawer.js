"use client";
"use strict";
import { Drawer, ListItem, ListItemText, List } from "@mui/material";
import React from "react";
import { useRouter } from "next/navigation";
import "../styles/styles.css";
function SideDrawer({ open, close, user }) {
  const router = useRouter();

  const reDirectToInfo = (id) => {
    router.push(`/info?sectionId=${id}`);
  };

  const redirectToLibrary = () => {
    router.push(`/library`);
  };

  return (
    <div className="appDrawer">
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        sx={{
          width: "250px",
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: "380px",
            boxSizing: "border-box",
            paddingTop: "80px",
            background: "#63899e",
            color: "#fff",
          },
        }}
      >
     <List>
  <ListItem button component="a" href="https://home.boardzy.app/">
    <p className="app-drawer-style">Welcome To Boardzy</p>
  </ListItem>

  <ListItem button component="a" href="https://home.boardzy.app/">
    <p className="app-drawer-style">What is Boardzy?</p>
  </ListItem>

  <ListItem button onClick={redirectToLibrary}>
    <p className="app-drawer-style">Boards Library</p>
  </ListItem>

  <ListItem button component="a" href="https://home.boardzy.app/">
    <p className="app-drawer-style">Dashboard your Life</p>
  </ListItem>
</List>

      </Drawer>
    </div>
  );
}

export default SideDrawer;


