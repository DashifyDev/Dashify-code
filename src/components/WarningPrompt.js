import React, { useEffect, useState } from 'react'
import '../styles/styles.css'
import { Alert, Dialog, DialogContent } from '@mui/material'
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import Collapse from '@mui/material/Collapse';

function WarningPrompt() {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(()=> {
        const popupTimeout1 = setTimeout(() => {
            setShowPopup(true);
          }, (30 * 1000)); 
        
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
    },[])

  return (
    <Dialog open={showPopup}>
      <span className="absolute top-4 right-7 cursor-pointer"
        onClick={() => { setShowPopup(false) }}>
        <CloseSharpIcon />
      </span>
      <DialogContent sx={{padding : "80px 25px"}}>
        Feel free to play around as long as you like,
        just remember to Sign In if you want to save your work.
      </DialogContent>
    </Dialog>
  )
}

export default WarningPrompt
