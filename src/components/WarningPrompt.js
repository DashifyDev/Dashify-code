import React, { useEffect, useState } from 'react'
import '../styles/styles.css'
import { Alert } from '@mui/material'

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
      {showPopup && (
        <div className="waring-popup">
             <Alert severity="error">Please Sign up! You loss your work</Alert> 
        </div>
      )}
    </>
  )
}

export default WarningPrompt
