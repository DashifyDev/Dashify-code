"use client";
import { Button, Grid, Stack } from "@mui/material";
import GridTiles from '../components/GridTiles';
import Header from "../components/Header";
import { userContext } from "@/context/userContext";
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from "react";
import WarningPrompt from "@/components/WarningPrompt";

export default function Home() {
  const [dbUser, setUser] = useState()
  const [defaultDashboard, setDefaultDashBoard ] = useState()
  const {user, isLoading} = useUser()
  
  useEffect(()=>{
    let localData  = JSON.parse(localStorage.getItem('Dasify'))
    if (user) {
      axios.post('/api/manage/getUser', user).then((res) => {
        setUser(res.data)
        if(localData){
          localStorage.removeItem('Dasify')
          clearSessionData(res.data._id , localData)
        }
      })      
    }
    else{
      if(!isLoading)
        createDefaultDashboard()
      }

  },[user,isLoading])

  const clearSessionData = (userId, localData) => {
    axios.post('/api/manage/addGuestData', {userId : userId , localData }).then((res) => {
      localStorage.removeItem('Dasify')
    })
  }


  const createDefaultDashboard = () => {
    let localData  = JSON.parse(localStorage.getItem('Dasify'))
    if(localData){
      return
    }

    var data = {
      _id : uuidv4(),
      name: 'My Dashboard',
      default: true,
      tiles:[]
    }
    localStorage.setItem("Dasify",JSON.stringify([data]))
    setDefaultDashBoard(data)
  }

  
  return (
    <userContext.Provider value={{ dbUser }}>
        <Header />  
        {!user && <WarningPrompt/>}
        <GridTiles defaultDashboard={defaultDashboard}/>  
    </userContext.Provider>
  );
}
