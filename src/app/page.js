"use client";
import { Button, Grid, Stack } from "@mui/material";
import GridTiles from '../components/GridTiles';
import Header from "../components/Header";
import { userContext } from "@/context/userContext";
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios'
import Login from "@/components/Login";

import { useState, useEffect } from "react";

export default function Home() {
  const [dbUser, setUser] = useState()
  const {user} = useUser()
  
  useEffect(()=>{
    if (user) {
      axios.post('/api/manage/getUser', user).then((res) => {
        setUser(res.data)
      })
    }
  },[user])
  
  return (
    <userContext.Provider value={{ dbUser }}>
      <Grid container
        display='flex'
        height="42vh"
        alignItems="center"
        justifyContent="center"
        flexDirection="column">
        <Header />
        {
          user ? <GridTiles/> : <Login/>
        }
        
      </Grid>
    </userContext.Provider>
  );
}
