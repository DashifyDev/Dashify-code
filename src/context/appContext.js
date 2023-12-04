"use client"
import React, { useState } from "react";
import PropTypes from "prop-types";
import { globalContext } from "./globalContext";
import { useUser } from "@auth0/nextjs-auth0/client";
import axios from "axios";

const AppContextProvider = ({ children }) => {
    const { user } = useUser();
    const [tiles, setTiles] = useState([])
    const [dbUser, setDbuser] = useState()
    const [activeBoard, setActiveBoard] = useState('')
    const [headerwidth,setHeaderWidth]=useState()
    const [boards, setBoards] = useState([])

    React.useEffect(() => {
        let localData  = JSON.parse(localStorage.getItem('Dasify'))
        if (user) {
            axios.post('/api/manage/getUser', user).then((res) => {
                setDbuser(res.data)
                if(localData){
                    localStorage.removeItem('Dasify')
                    addGuestUserData(res.data._id , localData)
                }
            })
        }
    }, [user]);

    const addGuestUserData = (userId, localData) => {
        axios.post('/api/manage/addGuestData', {userId : userId , localData }).then((res) => {
          localStorage.removeItem('Dasify')
        })
      }

    return (
        <globalContext.Provider
            value={{
                tiles,
                setTiles,
                dbUser,
                activeBoard, 
                setActiveBoard,
                setBoards,
                boards,
                setHeaderWidth,
                headerwidth
            }}
        >
            {children}
        </globalContext.Provider>
    );
};

export default AppContextProvider;

