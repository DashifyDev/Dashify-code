"use client";
"use strict";
import { Drawer, ListItem, ListItemText, List } from "@mui/material";
import React from "react";
import { useRouter } from "next/navigation";
import "../styles/styles.css";
function SideDrawer({ open, close, user }) {
  const router = useRouter();

  // const reDirectToInfo = (id) => {
  //   router.push(`/info?sectionId=${id}`);
  // };

  const redirectToHomepage = () => {
    router.push(`https://home.boardzy.app/`);
  };

  const redirectToLibrary = () => {
    router.push(`/library`);
  };

  const redirectToLife = () => {
    window.open(
      "https://dashboardyourlife.com/",
      "_blank",
      "noopener,noreferrer",
    );
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
          {/* <ListItem button onClick={() => reDirectToInfo("1qw")}>
            <p className="app-drawer-style">Welcome To Boardzy</p>
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo("2qw")}>
            <p className="app-drawer-style">What is Boardzy?</p>
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo("3qw")}>
            <p className="app-drawer-style">How to use it</p>
          </ListItem> */}
          <ListItem
            button
            style={{ flexDirection: "column" }}
            onClick={() => redirectToHomepage()}
          >
            <p className="app-drawer-style">Homepage</p>
            <p className="app-drawer-style-subtext">
              What is Boardzy & How to use it!
            </p>
          </ListItem>
          <ListItem
            button
            style={{ flexDirection: "column" }}
            onClick={() => redirectToLibrary()}
          >
            <p className="app-drawer-style">Boards Library</p>
            <p className="app-drawer-style-subtext">Quick-start templates</p>
          </ListItem>
          <ListItem
            button
            style={{ flexDirection: "column" }}
            onClick={() => redirectToLife()}
          >
            <p className="app-drawer-style">Dashboard Your Life</p>
            <p className="app-drawer-style-subtext">
              Get help creating your boards
            </p>
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
}

export default SideDrawer;




