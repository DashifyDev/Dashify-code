import React, { useEffect, useState } from "react";
import "../styles/styles.css";
import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";

function WarningPrompt() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const popupTimeout1 = setTimeout(() => {
      setShowPopup(true);
    }, 2 * 60 * 1000);

    const popupTimeout2 = setTimeout(() => {
      setShowPopup(true);
    }, 5 * 60 * 1000);

    const popupTimeout3 = setTimeout(() => {
      setShowPopup(true);
    }, 15 * 60 * 1000);

    return () => {
      clearTimeout(popupTimeout1);
      clearTimeout(popupTimeout2);
      clearTimeout(popupTimeout3);
    };
  }, []);

  return (
    <Dialog open={showPopup}>
      <DialogTitle sx={{ width: "300px" }}>
        Don’t forget to log in if you want to save your work.
      </DialogTitle>
      <DialogActions>
        <Button
          sx={{
            background: "#63899e",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#63899e",
            },
          }}
          onClick={() => setShowPopup(false)}
        >
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WarningPrompt;
