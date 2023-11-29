"use client"
import React, { useEffect, useState } from 'react'
import '../styles/styles.css'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

function isMobile(userAgent){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export default function IsMobilePrompt(){
    const [showPopup,setShowPopUp]=useState(false)

    useEffect(()=>{
        if(isMobile(navigator.userAgent)){
            setShowPopUp(true);
        }
    },[])
return(
    <Dialog open={showPopup} >
        <DialogTitle>Warning</DialogTitle>
        <DialogContent>Boardzy is not a mobile application. Please use it from desktop</DialogContent>
        <DialogActions>
            <Button onClick={()=>setShowPopUp(false)}>Close</Button>
        </DialogActions>
    </Dialog>
)
}
