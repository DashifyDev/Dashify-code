"use client";
'use strict'
import { Drawer, ListItem, ListItemText,List } from '@mui/material'
import React from 'react'
import { useRouter } from 'next/navigation'
import "../styles/styles.css"
function SideDrawer({open , close ,user}) {

  const router = useRouter()

  const reDirectToInfo = (id) => {
    router.push(`/info?sectionId=${id}`)  }

  return (
    <div className='appDrawer'>
      <Drawer anchor="right" open={open} onClose={close}
      sx={{
        width: '250px',
        flexShrink: 0,
        [`& .MuiDrawer-paper`]:
        { width: '380px', 
        boxSizing: 'border-box',
        paddingTop:"80px",
        background:'#63899e',
        color:'#fff',},
      }}>
        <List>
          <ListItem button onClick={() => reDirectToInfo('1qw')}>
            <p className='app-drawer-style'>Welcome To Boardzy</p>
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('2qw')}>
            <p className='app-drawer-style'>What is Boardzy?</p>
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('3qw')}>
            <p className='app-drawer-style'>How to use it</p>
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('4qw')}>
            <p className='app-drawer-style'>Boards Library</p>
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('5qw')}>
            <p className='app-drawer-style'>Dashboard your Life</p>
          </ListItem>
        </List>
      </Drawer>
    </div>
  )
}

export default SideDrawer
