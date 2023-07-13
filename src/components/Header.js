import {useState, React} from 'react'
import {  AppBar,  Toolbar,  Grid, Typography, Box} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CssBaseline from '@mui/material/CssBaseline';
import { IconButton, Avatar, Button } from '@mui/material';
import SideDrawer from './SideDrawer';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import '../styles/styles.css'

function Header() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { user, error, isLoading } = useUser();
  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  }
  return (
    <Box >
      <AppBar position="relative" color='transparent' 
        sx={{ 
          zIndex: (theme) => {return theme.zIndex.drawer + 1} ,
          backgroundColor: '#FFFFFF',
          }}>
        <CssBaseline/>
        <Toolbar>
          <Grid container display='flex' justifyContent='space-between'>
            <Grid item>
              <Typography>LOGO</Typography>
            </Grid>
            <Grid item>
            {user ?
              <Button>
                <Avatar src={user.picture}></Avatar>
              </Button>
              : <a href="/api/auth/login" className='sign_btn'>Sign up</a>
            }
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer}
              >
                <MenuIcon sx={{ color :'#45818e'}}/>
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <SideDrawer open={isDrawerOpen} close={toggleDrawer} user={user}/>
    </Box>
  )
}

export default Header
