"use client";
'use strict'
import { Drawer, ListItem, ListItemText,List } from '@mui/material'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function SideDrawer({open , close ,user}) {

  const router = useRouter()

  const reDirectToInfo = () => {
    router.push('/info')
  }
  
  return (
    <div className='appDrawer'>
      <Drawer anchor="right" open={open} onClose={close}
      sx={{
        width: '200px',
        flexShrink: 0,
        [`& .MuiDrawer-paper`]:
        { width: '200px', 
        boxSizing: 'border-box',
        paddingTop:"55px",
        background:'#63899e',
        color:'#fff', },
      }}>
        <List>
          <ListItem button>
            <ListItemText primary="About Boardzy" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="How to use Boardzy" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Dashboard Your life" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Contact Us" />
          </ListItem>
          <ListItem button onClick={() => reDirectToInfo()}>
            <ListItemText primary="Info"/>
          </ListItem>
        </List>
      </Drawer>
    </div>
  )
}

export default SideDrawer
