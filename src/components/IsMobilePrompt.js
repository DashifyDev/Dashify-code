"use client";
import React, { useEffect, useState } from "react";
import "../styles/styles.css";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

function isMobile(userAgent) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
}

export default function IsMobilePrompt() {
  const [showPopup, setShowPopUp] = useState(false);

  useEffect(() => {
    if (isMobile(navigator.userAgent)) {
      setShowPopUp(true);
    }
  }, []);
  return (
    <Dialog open={showPopup}>
      <DialogTitle>Important </DialogTitle>
      <DialogContent>
      We are actively working to optimize Boardzy for mobile devices. For the full experience please visit on a desktop device.
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowPopUp(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
