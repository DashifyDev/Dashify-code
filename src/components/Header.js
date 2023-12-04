'use client'
import {useState, React, useContext , useEffect, use, useRef} from 'react'
import AddSharpIcon from '@mui/icons-material/AddSharp';
import {  AppBar,  Toolbar,  Grid, Typography, Box, List , ListItem,ListItemText,
  Dialog, DialogTitle ,DialogContent, DialogActions, CardMedia } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CssBaseline from '@mui/material/CssBaseline';
import { IconButton, Avatar, Button, Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SideDrawer from './SideDrawer';
import { globalContext } from '@/context/globalContext';
import { ReactSortable } from "react-sortablejs";
import { useUser } from '@auth0/nextjs-auth0/client';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import '../styles/header.css'
import logo from "../assets/logo.png";
import Image from 'next/image';
import leftArrow from "../assets/leftArrow1.svg"
import rightArrow from "../assets/rightArrow.svg"
import { useRouter } from 'next/navigation';
import useAdmin from '@/hooks/isAdmin';
import { useParams } from 'next/navigation';

function Header() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showIcon , setShowIcon] = useState(null)
  const [openDashDeleteModel, setOpenDashDeleteModel] = useState(false)
  const [selectedDashIndex , setSelectedDashIndex] = useState(null)
  const [selectedDashboard, setSelectedDashboard] = useState(null)
  const [showDeshboardModel, setShowDashboardModel] = useState(false)
  const [dashBoardName, setDashBoardName] = useState('')
  const [anchorEl, setAnchorEl] = useState(null);
  const [options, setOptions] = useState(null)
  const  {isLoading,user} = useUser()
  const  {dbUser, tiles, setTiles, activeBoard, setActiveBoard, boards, setBoards,headerwidth}  = useContext(globalContext)
  const divRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const router = useRouter()
  const isAdmin = useAdmin()
  const {id} = useParams()
  const [shareLinkModal,setShareLinkModal]=useState(false)
  const [copiedUrl, setCopiedUrl] = useState("");
  const [isCopied,setIsCopied]=useState(false)
  
  useEffect(() => {
    const divElement = divRef.current.ref.current;
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
    if(dbUser && user){
      axios.get(`/api/dashboard/addDashboard/?id=${dbUser._id}`).then((res) => {
        if (res.data.length >= 1) {
          setBoards((prev) =>{
            return [ ...res.data]
          });
          if(!id){
            router.push(`/dashboard/${res.data[0]._id}`)
          }
        }
      })
    }
    else{
      if(!isLoading && !user){
        getDefaultDashboard()
      }
    }
    
  }, [user,dbUser,isLoading]);
  
  
  const getDefaultDashboard = async() => {
    let localData  = JSON.parse(localStorage.getItem('Dasify'))
    
    if(localData){
      setBoards((prev)=> [...localData])
      if(!id){
        if(localData.length > 0){
          router.push(`/dashboard/${localData[0]._id}`)
        }
      }
      return
    }

    axios.get('/api/dashboard/defaultDashboard').then(res=>{
      setBoards((prev)=> [...res.data])
      if(!id){
        if(res.data.length > 0){
          router.push(`/dashboard/${res.data[0]._id}`)
        }
      }
      localStorage.setItem("Dasify",JSON.stringify(res.data))
    })
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
    const occupiedTile = tiles.find(tile => tile.x === x && tile.y === newRowY);

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
    const lastTile = tiles[tiles.length - 1];
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
    displayTitle:true,
    backgroundAction:"color"
  }
  if(dbUser){
    axios.post('/api/tile/tile', newtile ).then((res)=>{
      setTiles([...tiles , res.data])
    })
  }
  else{
    let index = boards.findIndex(obj=> obj._id === activeBoard)
    let items = [...boards ] 
    let tiles = items[index].tiles
    tiles = [...tiles, newtile]
    items[index].tiles = tiles
    localStorage.setItem("Dasify",JSON.stringify(items))
    setTiles(tiles)
  }
}

const addBoard = () => {
  const boardsLength = boards.length
  setShowDashboardModel(false)
  let payload
  if(dbUser){
    if (isAdmin) {
        payload = {
          name: dashBoardName,
          userId: dbUser._id,
          hasAdminAdded: true,
        };
      } else {
        payload = {
          name: dashBoardName,
          userId: dbUser._id,
        };
      }
        axios.post("/api/dashboard/addDashboard", payload).then((res) => {
          setBoards([...boards, res.data]);
          if(boardsLength === 0){
            router.push(`/dashboard/${res.data._id}`)
          }
        });
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
      if(boardsLength === 0){
        router.push(`/dashboard/${payload._id}`)
      }
    }
  }

  const selectBoard = (dashboardId) => {
      router.push(`/dashboard/${dashboardId}`)
  }

  const updatedDashBoard = () => {
    setShowDashboardModel(false)
    const data= {
      name: dashBoardName,
    }
    if (dbUser) {
      axios.patch(`/api/dashboard/${selectedDashboard}`, data).then((res) => {
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
          // console.log("isUp", res.data)
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
    if (dbUser) {
      axios.delete(`/api/dashboard/${id}`).then((res) => {
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
    if(isLastIndex && index === 0){
      router.push('/dashboard')
    }
    else{
      isLastIndex
      ? selectBoard(boards[index - 1]._id,)
      : selectBoard(boards[index]._id)
    }
  }

  const handlePicClick = (event) => {
    setAnchorEl(event.currentTarget);
    navigator.clipboard.writeText(window.location.href)
  }
  
  async function handleCopy(){
    await navigator.clipboard.writeText(location.href);
      setIsCopied(true)
   }

   const duplicateBoard = (currentBoard) => {
     if (dbUser) {
       const newBoard = { ...currentBoard };
       axios.post("/api/dashboard/duplicateDashboard", newBoard).then((res) => {
         setBoards([...boards, res.data]);
       });
     } else {
      const newBoard={...currentBoard,_id:uuidv4()}
       setBoards([...boards, newBoard]);
       localStorage.setItem("Dasify", JSON.stringify([...boards, newBoard]));
     }
   };
  
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
          width: headerwidth
        }}
      >
        <CssBaseline />
        <Toolbar>
          <Grid container display="flex" justifyContent="space-between" className='header_container'>
            <Grid item className="left_content">
              <div className="add_tiles" onClick={addTiles}>
                <AddSharpIcon />
              </div>
              <div className="vertical"></div>
              <div className="board_nav">
                <ReactSortable
                  ref={divRef}
                  filter=".dashboard_btn"
                  dragClass="sortableDrag"
                  list={boards}
                  setList={(list) => setBoardPosition(list)}
                  animation="200"
                  easing="ease-out"
                  className="dashboard_drag"
                >
                  {boards.map((board, index) => {
                    return (
                      <List key={board._id}>
                        <ListItem
                          button
                          onMouseEnter={() => {setShowIcon(board._id); setOptions(null)}}
                          onMouseLeave={() => setShowIcon(null)}
                          onClick={(e) => {
                            selectBoard(board._id);
                          }}
                          onTouchStart={(e) => {
                            if (isDblTouchTap(e)) {
                              selectBoard(board._id);
                            }
                          }}
                        >
                          <ListItemText
                            primary={board.name}
                            primaryTypographyProps={{
                              style: {
                                fontWeight:
                                  board._id === activeBoard ? "bold" : "normal",
                              },
                            }}
                          />
                          {showIcon === board._id &&
                           (
                              <span
                                className="cross"
                                onClick={(e) => {
                                  options ? setOptions(null) : setOptions(e.currentTarget);
                                }}
                              >
                                <KeyboardArrowDownIcon fontSize='small'/>
                              <Menu
                                anchorEl={options}
                                open={Boolean(options)}
                                onClose={() => setOptions(null)}
                                anchorOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                                transformOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                              >
                                <MenuItem onClick={()=> {
                                   setOptions(null); setOpenDashDeleteModel(true),
                                   setSelectedDashboard(board._id);setSelectedDashIndex(index);
                                }}>Delete</MenuItem>
                                {dbUser && <MenuItem onClick={() => {
                                   setOptions(null)
                                   setShareLinkModal(true)
                                   setCopiedUrl(window.location.href)
                                }}>Share</MenuItem> }
                                <MenuItem onClick={()=>{
                                   setOptions(null); setSelectedDashboard(board._id);
                                   setDashBoardName(board.name); setShowDashboardModel(true)
                                }}>Rename</MenuItem>
                                <MenuItem onClick={()=>{duplicateBoard(board)}}>
                                Duplicate
                                </MenuItem>
                              </Menu>
                              </span>
                            )}
                        </ListItem>
                      </List>
                    );
                  })}
                </ReactSortable>
                {isOverflowing && (
                  <div className="scroll-bar">
                    <div className="vertical"></div>
                    <div className="scroll-buttons">
                      <Image
                        src={leftArrow}
                        onClick={() => handleScroll("left")}
                      />
                      <Image
                        src={rightArrow}
                        onClick={() => handleScroll("right")}
                      />
                    </div>
                    <div className="vertical"></div>
                  </div>
                )}
              </div>
              <Button
                  className="dashboard_btn"
                  sx={{ p: "11px" }}
                  onClick={() => {
                    setShowDashboardModel(true);
                    setSelectedDashboard(null);
                    setDashBoardName("");
                  }}
                  disabled={isAdmin && boards.length>=4}
                >
                  + New
                </Button>
            </Grid>
            <Grid item className="right_header">
              <Image className="logo" src={logo} alt="logo" />
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                className='menu-button'
                onClick={toggleDrawer}
              >
                <MenuIcon sx={{ color: "#45818e" }} />
              </IconButton>
              {user ? (
                <div>
                  <Button onClick={(e) => handlePicClick(e)}>
                    <Avatar src={user.picture}></Avatar>
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => {
                      setAnchorEl(null);
                    }}
                  >
                    <div className="email">{user.email}</div>
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

      {/* Delete DashBoard Model */}
      <Dialog open={openDashDeleteModel} className="model">
        <DialogTitle sx={{ width: "270px" }}>
          Are you sure you want to delete?
        </DialogTitle>
        <DialogActions>
          <Button
            className="button_cancel"
            sx={{ color: "#63899e" }}
            onClick={() => {
              setOpenDashDeleteModel(false), setSelectedDashIndex(null);
            }}
          >
            Cancel
          </Button>
          <Button
            className="button_filled"
            sx={{
              background: "#63899e",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#63899e",
              },
            }}
            onClick={() => {
              deleteDashboard(selectedDashboard, selectedDashIndex);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* DashBoard Model */}
      <Dialog open={showDeshboardModel}>
        <DialogTitle>
          {selectedDashboard ? "Update Dashboard" : "Add Dashboard"}
        </DialogTitle>
        <DialogContent sx={{ width: "300px" }}>
          <input
            type="text"
            value={dashBoardName}
            placeholder="Enter Dashboard Name"
            onChange={changeDashboardName}
            style={{ height: "40px", width: "100%" }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            className="button_cancel"
            sx={{ color: "#63899e" }}
            onClick={() => setShowDashboardModel(false)}
          >
            Cancel
          </Button>
          {selectedDashboard ? (
            <Button
              className="button_filled"
              sx={{
                background: "#63899e",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#63899e",
                },
              }}
              onClick={() => {
                updatedDashBoard();
              }}
            >
              Save
            </Button>
          ) : (
            <Button
              className="button_filled"
              sx={{
                background: "#63899e",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#63899e",
                },
              }}
              onClick={() => {
                addBoard();
              }}
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Share Link Modal */}
      <Dialog open={shareLinkModal}>
        <DialogContent>
          <div className='copiedUrl-content'>
          <p>{copiedUrl}</p>
          </div>
        </DialogContent>
        <DialogActions>
          {isCopied?<Button disabled>Copied</Button>:
          <Button onClick={() => handleCopy()}>Copy</Button>
          }
          <Button onClick={()=>{setShareLinkModal(false);setIsCopied(false)}}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Header
