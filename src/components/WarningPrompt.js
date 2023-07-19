import React, { useEffect, useState } from 'react'
import '../styles/styles.css'
import { Alert } from '@mui/material'
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import Collapse from '@mui/material/Collapse';

function WarningPrompt() {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(()=> {
        const popupTimeout1 = setTimeout(() => {
            setShowPopup(true);
          }, (30 * 1000)); 

          const removePopupTimeout1 = setTimeout(() => {
            setShowPopup(false);
          }, (30*1000)+(10*1000));
        
          const popupTimeout2 = setTimeout(() => {
            setShowPopup(true);
          }, 5 * 60 * 1000); 

          const removePopupTimeout2 = setTimeout(() => {
            setShowPopup(false);
          }, (5 * 60 * 1000)+(10*1000));
        
          const popupTimeout3 = setTimeout(() => {
            setShowPopup(true);
          }, 15 * 60 * 1000); 

          const removePopupTimeout3 = setTimeout(() => {
            setShowPopup(false);
          }, (15 * 60 * 1000)+(10*1000));
        
        
          return () => {
            clearTimeout(popupTimeout1);
            clearTimeout(popupTimeout2);
            clearTimeout(popupTimeout3);
            clearTimeout(removePopupTimeout1);
            clearTimeout(removePopupTimeout2);
            clearTimeout(removePopupTimeout3);
          };
    },[])

  return (
    <>
      {/* {showPopup && ( */}
        <div className="waring-popup">
          <Collapse in={showPopup}>
             <Alert severity="error"  onClose={() => {setShowPopup(false)}}>Feel free to play around as long as you like, 
             just remember to Sign In if you want to save your work.
             </Alert> 
          </Collapse>
        </div>
      {/* )}  */}
    </>
  )
}

export default WarningPrompt
