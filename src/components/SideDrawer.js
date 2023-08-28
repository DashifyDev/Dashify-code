"use client";
'use strict'
import { Drawer, ListItem, ListItemText,List } from '@mui/material'
import React from 'react'
import { useRouter } from 'next/navigation'

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
        { width: '250px', 
        boxSizing: 'border-box',
        paddingTop:"55px",
        background:'#63899e',
        color:'#fff', },
      }}>
        <List>
          <ListItem button onClick={() => reDirectToInfo('1qw')}>
            <ListItemText primary="Welcome to Boardzy!" />
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('2qw')}>
            <ListItemText primary="What is Boardzy?" />
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('3qw')}>
            <ListItemText primary="How to use Boardzy" />
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('4qw')}>
            <ListItemText primary="Browse Boards" />
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo('5qw')}>
            <ListItemText primary="Also: Dashboard Your Life"/>
          </ListItem>
        </List>
      </Drawer>
    </div>
  )
}

export default SideDrawer
