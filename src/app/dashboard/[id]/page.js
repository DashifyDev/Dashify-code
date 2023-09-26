"use client"
import React, { useEffect, useContext, useState } from 'react'
import { globalContext } from '@/context/globalContext';
import GridTiles from '@/components/GridTiles';
import axios from 'axios';

function page({params}) {
  
  const { id } = params
  const { dbUser, tiles, setTiles ,boards,setBoards,
          activeBoard, setActiveBoard, } = useContext(globalContext)

  useEffect(() => {
    if (boards.length >= 1) {
      if (dbUser) {
        let index = boards.findIndex(obj => obj._id === id)
        let isSameUser
        if (index >= 0) {
          isSameUser = true
        }
        else {
          isSameUser = false
        }
        getTileDataWhileUser(isSameUser)
      }
      else {
        let boards = JSON.parse(localStorage.getItem("Dasify"));
        if (boards) {
          if (boards.length > 0) {
            let index = boards.findIndex(obj => obj._id === id)
            if (index >= 0) {
              setActiveBoard(id)
              setTiles(boards[index].tiles);
            }
            else {
              getTileDataWhileGuestUser()
            }
          }
        }
      };
    }
  }, [id,dbUser, boards.length>=1])

  const getTileDataWhileGuestUser = () => {
    axios.get(`/api/dashboard/${id}`).then((res) => {
      setActiveBoard(id)
      setTiles(res.data.tiles)
      setBoards((prev) => {
        let data = [res.data, ...prev]
       localStorage.setItem('Dasify', JSON.stringify(data));
       return [res.data, ...prev]
      })
    })
  }

  const getTileDataWhileUser = (sameUser) => {
    axios.get(`/api/dashboard/${id}`).then((res) => {
      if(sameUser){
        setActiveBoard(id)
        setTiles(res.data.tiles)
      }
      else if(!sameUser){
        assignDatatoUser(res.data)
      }
    })
  }

  const assignDatatoUser = async(data) => {
    const response = await axios.post(`/api/manage/addLink?id=${dbUser._id}`,data)
    let dashboard = response.data
    setActiveBoard(dashboard._id)
    setTiles(dashboard.tiles)
    setBoards((prev) =>{  
      return [dashboard , ...prev ]
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
    <div>
      <GridTiles
        tileCordinates={tiles}
        setTileCordinates={setTiles}
        updateTilesInLocalstorage={updateTilesInLocalstorage}
        activeBoard={activeBoard}
      />
    </div>
  )
}

export default page
