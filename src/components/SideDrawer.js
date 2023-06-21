import { Drawer, ListItem, ListItemText,List } from '@mui/material'
import React from 'react'

function SideDrawer({open , close}) {
  return (
    <div className='appDrawer'>
      <Drawer anchor="right" open={open} onClose={close}
      sx={{
        width: '200px',
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: '200px', boxSizing: 'border-box',paddingTop:"55px" },
      }}>
        <List>
          <ListItem button>
            <ListItemText primary="About" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="How to use" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Contact Us" />
          </ListItem>
        </List>
      </Drawer>
    </div>
  )
}

export default SideDrawer
