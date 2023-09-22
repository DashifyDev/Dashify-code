'use client'
import {useState, React, useContext , useEffect} from 'react'
import {  AppBar,  Toolbar,  Grid, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CssBaseline from '@mui/material/CssBaseline';
import { IconButton, Avatar, Button, Menu, MenuItem } from '@mui/material';
import SideDrawer from '@/components/SideDrawer';
import { globalContext } from '@/context/globalContext';
import '../../styles//header.css'
import logo from "../../assets/logo.png";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function LibraryHeader() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const  {dbUser}  = useContext(globalContext)
  const router=useRouter();
  

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  }


  const handlePicClick = (event) => {
    setAnchorEl(event.currentTarget);
    navigator.clipboard.writeText(window.location.href)
  }
  
  return (
    <Box>
      <AppBar
        position="relative"
        color="transparent"
        sx={{
          zIndex: (theme) => {
            return theme.zIndex.drawer + 1;
          },
          backgroundColor: "#FFFFFF",
        }}
      >
        <CssBaseline />
        <Toolbar>
          <Grid container display="flex" justifyContent="space-between">
            <Grid item className="libray-heading">
                Boards Library
            </Grid>
            <Grid item className="right_header">
              <a href='/dashboard'>
              <Image className="logo" src={logo} alt="logo"/>
              </a>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer}
              >
                <MenuIcon sx={{ color: "#45818e" }} />
              </IconButton>
              {dbUser ? (
                <div>
                  <Button onClick={(e) => handlePicClick(e)}>
                    <Avatar src={dbUser.picture}></Avatar>
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => {
                      setAnchorEl(null);
                    }}
                  >
                    <div className="email">{dbUser.email}</div>
                    <div className="horizonLine"></div>
                    <div className="logout">
                      <a href="/api/auth/logout">Log out</a>
                    </div>
                  </Menu>
                </div>
              ) : (
                <div>
                  <a href="/api/auth/login" className="sign_btn">
                    Sign up
                  </a>
                  <a href="/api/auth/login" className="login_btn">
                    Login
                  </a>
                </div>
              )}
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <SideDrawer open={isDrawerOpen} close={toggleDrawer} user={dbUser} />
    </Box>
  );
}

export default LibraryHeader

