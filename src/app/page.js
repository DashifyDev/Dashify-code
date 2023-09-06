"use client";
import GridTiles from '../components/GridTiles';
import Header from "../components/Header";
import { userContext } from "@/context/userContext";
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from "react";
import WarningPrompt from "@/components/WarningPrompt";
import { welcomeBoardzy } from '@/constants/defaultDashboard';
import useAdmin from '@/hooks/isAdmin';
export default function Home() {
  const [dbUser, setUser] = useState()
  const [defaultDashboard, setDefaultDashBoard ] = useState()
  const [tiles, setTiles] = useState([])
  const [activeBoard, setActiveBoard] = useState('')
  const [boards, setBoards] = useState([]);
  const {user, isLoading} = useUser()
  // const [isAdmin,setIsAdmin]=useState(false)
  const isAdmin=useAdmin()
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
  },[user,isLoading,isAdmin])

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
    axios.get('/api/dashboard/defaultDashboard').then(res=>{
      localStorage.setItem("Dasify",JSON.stringify(res.data))
    setDefaultDashBoard(res.data)
    })

  }

  const updateTilesInLocalstorage= (tileArray) => {
    let items = boards
    let boardIndex = items.findIndex(obj => obj._id === activeBoard);
    let item = items[boardIndex]
    item.tiles = tileArray
    items[boardIndex] = item
    setBoards(items)
    localStorage.setItem("Dasify",JSON.stringify(items))
  }

  
  return (
    <userContext.Provider value={{ dbUser }}>
      <Header
        boards={boards} 
        setBoards={setBoards}
        defaultDashboard={defaultDashboard} 
        tileCordinates={tiles} 
        setTileCordinates={setTiles} 
        activeBoard = {activeBoard}
        setActiveBoard={setActiveBoard}
        updateTilesInLocalstorage={updateTilesInLocalstorage}
        isAdmin={isAdmin}
      />
      {!user && <WarningPrompt />}
      <GridTiles 
        tileCordinates={tiles} 
        setTileCordinates={setTiles} 
        activeBoard = {activeBoard}
        updateTilesInLocalstorage={updateTilesInLocalstorage}
      />
    </userContext.Provider>
  );
}
