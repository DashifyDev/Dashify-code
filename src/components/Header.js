import {useState, React, useContext , useEffect, use, useRef} from 'react'
import AddSharpIcon from '@mui/icons-material/AddSharp';
import {  AppBar,  Toolbar,  Grid, Typography, Box, List , ListItem,ListItemText,
  Dialog, DialogTitle ,DialogContent, DialogActions, CardMedia } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CssBaseline from '@mui/material/CssBaseline';
import { IconButton, Avatar, Button, Menu, MenuItem } from '@mui/material';
import SideDrawer from './SideDrawer';
import { userContext } from '@/context/userContext';
import { ReactSortable } from "react-sortablejs";
import { useUser } from '@auth0/nextjs-auth0/client';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import '../styles/header.css'
import logo from "../assets/logo.png";
import Image from 'next/image';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

function Header({defaultDashboard,tileCordinates, setTileCordinates,activeBoard,setActiveBoard,
                  boards, setBoards, updateTilesInLocalstorage}) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showIcon , setShowIcon] = useState(null)
  const [openDashDeleteModel, setOpenDashDeleteModel] = useState(false)
  const [selectedDashIndex , setSelectedDashIndex] = useState(null)
  const [selectedDashboard, setSelectedDashboard] = useState(null)
  const [showDeshboardModel, setShowDashboardModel] = useState(false)
  const [dashBoardName, setDashBoardName] = useState('')
  const [anchorEl, setAnchorEl] = useState(null);

  const { dbUser } = useContext(userContext)
  const { user, error, isLoading } = useUser();
  const divRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);


  useEffect(() => {
    const divElement = divRef.current.ref.current;
    console.log(divElement);
    if (divElement) {
      if (divElement.scrollWidth > divElement.clientWidth) {
        setIsOverflowing(true);
      } else {
        setIsOverflowing(false);
      }
    }
  }, [boards]);

  const handleScroll = (direction) => {
    const divElement = divRef.current.ref.current;

    if (divElement) {
      if (direction === 'left') {
        divElement.scrollLeft -= 100; 
      } else if (direction === 'right') {
        divElement.scrollLeft += 100; 
      }
    }
  };

  useEffect(() => {
    if(defaultDashboard){
      setBoards([defaultDashboard])
    }
    if(dbUser){
      axios.get(`/api/dashboard/addDashboard/?id=${dbUser._id}`).then((res) => {
        if (res.data.length >= 1) {
          setBoards(res.data);
          setActiveBoard(res.data[0]._id)
          axios.get(`api/dashboard/${res.data[0]._id}`).then((res) => {
                  setTileCordinates(res.data.tiles)
                })
        }
      })
    }
    else{
      if(!isLoading)
      getDataFromSession()
    }
    
  }, [dbUser, defaultDashboard,isLoading]);

  const getDataFromSession = () => {
    let boards = JSON.parse(localStorage.getItem('Dasify'))
    if(boards){
      setActiveBoard(boards[0]._id)
      setBoards(boards)
      setTileCordinates(boards[0].tiles)
    }
  }


  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  }

  const addTiles = () => {
  const tileWidth = 135; 
  const tileHeight = 135; 
  const tileMargin = 10; 
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let foundEmptySpace = false;
  let newRowY = 25;
  let newX = 25;

  for (let x = 25; x <= windowWidth - tileWidth; x += tileWidth + tileMargin) {
    const occupiedTile = tileCordinates.find(tile => tile.x === x && tile.y === newRowY);

    if (!occupiedTile) {
      foundEmptySpace = true;
      newX = x;
      break;
    }
  }

  let newY;
  if (foundEmptySpace) {
    newY = newRowY;
  } else {
    const lastTile = tileCordinates[tileCordinates.length - 1];
    if (lastTile) {
      newX = 25;
      newY = 170

      if (newY + tileHeight > windowHeight) {
        newX = 25;
        newY = 25;
      }
    } else {
      newX = 25;
      newY = 25;
    }
  }
  if (newX + tileWidth > windowWidth) {
    newX = 25;
    newY += tileHeight + tileMargin;
    if (newY + tileHeight > windowHeight) {
      newX = 25;
      newY = 25;
    }
  }
  
    const newtile = {
      dashboardId: activeBoard,
      width: '135px',
      height: '135px',
      x: newX,
      y: newY,
      titleX:2,
      titleY:2,
      action : 'textEditor',
      displayTitle:true
    }
    if(dbUser){
      axios.post('/api/tile/tile', newtile ).then((res)=>{
        setTileCordinates([...tileCordinates , res.data])
      })
    }
    else{
      let items = [...tileCordinates,newtile]
      updateTilesInLocalstorage(items)
      setTileCordinates(items)
    }
  }

  const addBoard = () => {
    setShowDashboardModel(false)
    let payload
    if(dbUser){
      payload={
        name: dashBoardName,
        userId: dbUser._id
      }
      axios.post('/api/dashboard/addDashboard', payload ).then((res)=> {
        setBoards([...boards, res.data])
      })  
    }
    else {
      payload={
        _id : uuidv4(),
        name: dashBoardName,
        tiles : []
      }
      let items = boards
      items = [...items , payload]
      localStorage.setItem("Dasify",JSON.stringify(items))
      setBoards(items)
    }
  }

  const selectBoard = (e,dashboardId , board , index) => {
    if (e && (e.type === "touchstart" || e.detail == 2)) {
      setSelectedDashboard(dashboardId);
      setDashBoardName(board.name)
      setShowDashboardModel(true)
    } else {
      if (dbUser) {
        axios.get(`api/dashboard/${dashboardId}`).then((res) => {
          setTileCordinates(res.data.tiles)
          setActiveBoard(dashboardId)
        })
      }
      else{
        let tiles = boards[index].tiles
        setTileCordinates(tiles)
        setActiveBoard(dashboardId)
      }
    }
  }

  const updatedDashBoard = () => {
    setShowDashboardModel(false)
    const data= {
      name: dashBoardName,
    }
    if (dbUser) {
      axios.patch(`api/dashboard/${selectedDashboard}`, data).then((res) => {
        if (res) {
          const updatedList = boards.map(board => {
            if (board._id === res.data._id) {
              return res.data;
            }
            return board;
          });
          setBoards(updatedList)
        }
      })
    }
    else {
      let items = boards
      let boardIndex = items.findIndex(obj => obj._id === selectedDashboard);
      let item = items[boardIndex]
      item = {...item , name: dashBoardName}
      items[boardIndex] = item
      localStorage.setItem("Dasify", JSON.stringify(items))
    }
  }

  const changeDashboardName =(e) =>{
    setDashBoardName(e.target.value)
  }

  const setBoardPosition = (list) =>{
    if (dbUser) {
      setBoards(list)
      let listArray = list.map((item, index) => {
        return { position: index + 1 , _id: item._id }
      })
      if (list.length > 1) {
        axios.patch('/api/dashboard/addDashboard', listArray).then((res) => {
          console.log("isUp", res.data)
        })
      }
    }
    else {
      if(list.length > 1){
        setBoards(list)
        localStorage.setItem('Dasify',JSON.stringify(list))
      }
    }
  }

  const deleteDashboard = ( id , index) =>{
    let isLastIndex = index == boards.length-1 ? true : false
    console.log(isLastIndex)
    if (dbUser) {
      axios.delete(`api/dashboard/${id}`).then((res) => {
        if (res) {
          boards.splice(index, 1)
          setBoards(boards)
          setDash(isLastIndex, index)
        }
      })
    }
    else{
      let items = boards
      items.splice(index, 1)
      setBoards(items)
      localStorage.setItem("Dasify",JSON.stringify(items))
      setDash(isLastIndex, index)
    }
    setOpenDashDeleteModel(false)
    setSelectedDashIndex(null)
  }

  const setDash = (isLastIndex, index ) => {
    isLastIndex
       ? selectBoard(null, boards[index - 1]._id, boards[index - 1], index - 1)
       : selectBoard(null, boards[index]._id, boards[index], index)
  }

  const handlePicClick = (event) => {
      setAnchorEl(event.currentTarget);
  }

  const handleLogout = () => {
    router.push("/api/auth/logout")
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
            <Grid item className='left_content'>
              <div className="add_tiles" onClick={addTiles}>
                <AddSharpIcon />
              </div>
              <div className = "vertical"></div>
              <div className='board_nav'>
              {isOverflowing && (
                  <div className="scroll-buttons">
                    <button onClick={() => handleScroll('left')}><ArrowLeftIcon/></button>
                  </div>
                )}
                <ReactSortable
                  ref={divRef}
                  filter=".dashboard_btn"
                  dragClass="sortableDrag"
                  list={boards}
                  setList={(list) => setBoardPosition(list)}
                  animation="200"
                  easing="ease-out"
                  className='dashboard_drag'>
                  {boards.map((board, index) => {
                    return (
                      <List key={board._id}>
                        <ListItem button
                          onMouseEnter={() => setShowIcon(board._id)}
                          onMouseLeave={() => setShowIcon(null)}
                          onClick={(e) => { selectBoard(e, board._id, board, index) }}
                          onTouchStart={(e) => {
                            if (isDblTouchTap(e)) {
                              selectBoard(e, board._id, board, index)
                            }
                          }} >
                          <ListItemText primary={board.name}
                            primaryTypographyProps={{
                              style: { fontWeight: board._id === activeBoard ? 'bold' : 'normal' },
                            }}
                          />
                          {(showIcon === board._id && !board.default && board._id !== activeBoard) &&
                            <span className="cross"
                              onClick={() => {
                                setOpenDashDeleteModel(true),
                                setSelectedDashboard(board._id)
                                setSelectedDashIndex(index)
                              }}>
                              x
                            </span>}
                        </ListItem>
                      </List>
                    )
                  })}
                </ReactSortable>
                {isOverflowing && (
                  <div className="scroll-buttons">
                    <button onClick={() => handleScroll('right')}><ArrowRightIcon/></button>
                  </div>
                )}

                <Button className='dashboard_btn' sx={{ p: '11px' }} onClick={() => {
                  setShowDashboardModel(true);
                  setSelectedDashboard(null);
                  setDashBoardName('')
                }}>+ New</Button>
              </div>

              
            </Grid>
            <Grid item className='right_header'>
              <Image 
                className='logo'
                src={logo}
                alt="logo"
              />
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer}
              >
                <MenuIcon sx={{ color: '#45818e' }} />
              </IconButton>
              {user ?    
               <div>
               <Button onClick={(e)=>handlePicClick(e)}>
                 <Avatar src={user.picture}></Avatar>
               </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => { setAnchorEl(null) }}
                  >
                    <div className='email'>{user.email}</div>
                    <div className='horizonLine'></div>
                    <div className='logout' >
                      <a href="/api/auth/logout" >Log out</a> 
                    </div>
                  </Menu>
             </div>
                 : 
                <div>
                  <a href="/api/auth/login" className='sign_btn'>Sign up</a>
                  <a href="/api/auth/login"className='login_btn'>Login</a>
                </div>
                }
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <SideDrawer open={isDrawerOpen} close={toggleDrawer} user={user}/>

      {/* Delete DashBoard Model */}
      <Dialog open={openDashDeleteModel} className='model'>
        <DialogTitle sx={{ width: "270px" }}>
          Are you sure you want to delete?
        </DialogTitle>
        <DialogActions>
          <Button className='button_cancel'
          sx={{ color: '#63899e' }}
           onClick={() => { 
            setOpenDashDeleteModel(false), 
            setSelectedDashIndex(null) }}>
              Cancel
          </Button>
          <Button className='button_filled'
            sx={{ 
              background: '#63899e',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#63899e',
              }
            }}  
            onClick={() => { deleteDashboard(selectedDashboard, selectedDashIndex) }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

        {/* DashBoard Model */}
        <Dialog open={showDeshboardModel}  >
          <DialogTitle>{selectedDashboard ?'Update Dashboard' :'Add Dashboard'}</DialogTitle>
          <DialogContent sx={{width:"300px"}}>
          <input type="text"
            value={dashBoardName}
            placeholder='Enter Dashboard Name'
            onChange={changeDashboardName}
            style={{ height:'40px', width:'100%'}}
          />
        </DialogContent> 
        <DialogActions>
          <Button className='button_cancel' sx={{ color: '#63899e' }}
           onClick={()=> setShowDashboardModel(false)}>Cancel</Button>
         { selectedDashboard 
            ? <Button className='button_filled'
              sx={{
                background: '#63899e',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#63899e',
                }
              }} onClick={()=>{updatedDashBoard()}} >Save</Button>
            : <Button className='button_filled'
              sx={{
                background: '#63899e',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#63899e',
                }
              }}  
            onClick={()=>{addBoard()}}>Save</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Header
