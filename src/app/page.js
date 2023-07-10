"use client";
import { Button, Grid, Stack } from "@mui/material";
import GridTiles from '../components/GridTiles';
import Header from "../components/Header";
import { userContext } from "@/context/userContext";
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from "react";

export default function Home() {
  const [dbUser, setUser] = useState()
  const [defaultDashboard, setDefaultDashBoard ] = useState()
  const {user} = useUser()
  
  useEffect(()=>{
    let sessionId = localStorage.getItem('session')
    if (user) {
      axios.post('/api/manage/getUser', user).then((res) => {
        setUser(res.data)
        if(sessionId){
          clearSessionData(res.data._id , sessionId)
        }
      })      
    }
    else{
      let sessionId = localStorage.getItem('session')
      if (!sessionId){
        createDefaultDashboard()
      }
    }

  },[user])

  const clearSessionData = (userId, sessionId) => {
    axios.post('/api/manage/manageSession', {userId : userId, sid:sessionId }).then((res) => {
      localStorage.removeItem('session')
    })
  }


  const createDefaultDashboard = () => {
    var sessionId = uuidv4() 
    var data = {
      name: 'My Dashboard',
      default: true,
      sessionId: sessionId
    }
    localStorage.setItem("session",sessionId)
    axios.post('/api/dashboard/addDashboard', data).then((res) => {
      setDefaultDashBoard(res.data)
    })
  }

  
  return (
    <userContext.Provider value={{ dbUser }}>
      <Grid container
        display='flex'
        height="42vh"
        alignItems="center"
        justifyContent="center"
        flexDirection="column">
        <Header />  
        <GridTiles defaultDashboard={defaultDashboard}/>  
      </Grid>
    </userContext.Provider>
  );
}
