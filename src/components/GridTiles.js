"use client";
'use strict'
import AddSharpIcon from '@mui/icons-material/AddSharp';
import React, { useState, useEffect, useRef, useContext } from 'react';
import '../styles/styles.css'
import { Rnd } from "react-rnd";
import MoreHorizSharpIcon from '@mui/icons-material/MoreHorizSharp';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import ColorizeSharpIcon from '@mui/icons-material/ColorizeSharp';
import TitleSharpIcon from '@mui/icons-material/TitleSharp';
import AddLinkSharpIcon from '@mui/icons-material/AddLinkSharp';
import DeleteSweepSharpIcon from '@mui/icons-material/DeleteSweepSharp';
import { ChromePicker } from 'react-color';
import ColorPicker from './ColorPicker';
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, List, ListItem, ListItemText, } from '@mui/material';
import TextEditor from './TextEditor';
import { ReactSortable } from "react-sortablejs";
import axios from 'axios';
import { userContext } from '@/context/userContext';



export default function GridTiles() {
  const [tilesCount, setTilesCount] = useState([""]);
  const [showOption, setShowOption] = useState(null);
  const [displayColorPicker, setDisplayColorPicker] = useState(null);
  const [showModel, setShowModel] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedPod, setSelectedPod] = useState(null)
  const [changedTitle, setChangedTitle] = useState('Tiles');
  const [tileCordinates, setTileCordinates] = useState([])
  const [colorImage, setColorImage] = useState('color')
  const [textLink, setTextLink] = useState('text')
  const [imageFileName, setImageFileName] = useState(null)
  const [formValue, setFormValue] = useState({})
  const [boards, setBoards] = useState([]);
  const [pods, setPods] = useState([])
  const [openTextEditor, setOpenTextEdior] = useState(false)
  const [selectedTileDetail, setSelectedTileDetail] = useState({})
  const [dashBoardName, setDashBoardName] = useState('')
  const [textEditorContent, setTextEditorContent] = useState()
  const [disableDrag, setDisableDrag] = useState(false);
  const [showDeshboardModel, setShowDashboardModel] = useState(false)
  const [activeBoard, setActiveBoard] = useState('')
  const [showIcon , setShowIcon] = useState(null)
  const [dashbardUpdateId, setDashboardUpdateId] = useState(null)

  const { dbUser } = useContext(userContext)
  const hiddenFileInput = useRef(null)
  useEffect(() => {
    if(dbUser){
      axios.get(`/api/dashboard/addDashboard/?id=${dbUser._id}`).then((res)=>{
        setBoards(res.data);
        setActiveBoard(res.data[0]._id)
        axios.get(`api/dashboard/${res.data[0]._id}`).then((res) => {
          setTileCordinates(res.data.tiles)
          setPods(res.data.pods)
        })
      })
    }
    
  }, [dbUser]);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker)
  };

  const handleClose = () => {
    setDisplayColorPicker(false)
  };



  const addTiles = () => {
    const naturalNumberx = Math.floor(Math.random() * 1000);
    const naturalNumbery = Math.floor(Math.random() * 350)
    //var timestamp = new Date().getTime().toString();
    //var uniqueId = timestamp.substr(timestamp.length - 6);
    const newtile = {
      dashboardId: activeBoard,
      width: '200px',
      height: '200px',
      x: naturalNumberx,
      y: naturalNumbery
    }
    axios.post('/api/tile/tile', newtile ).then((res)=>{
      console.log("====>>>",res.data)
      setTileCordinates([...tileCordinates , res.data])
    })
  }

  // const style = {
  //   display: "flex",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   border: "solid 1px #ddd",
  //   background: "pink",
  //   color: 'black',
  //   borderRadius: '10px' ,
  //   margin: '10px 20px'
  // };



  const handleColorImage = (e) => {
    setColorImage(e.target.value)
  }

  const handleTextLink = (e) => {
    setTextLink(e.target.value)
  }

  const handleChange = (color) => {
    // console.log('color',color)
  };


  const popover = {
    position: 'absolute',
    zIndex: '9999',
  }
  const cover = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  }

  const openModel = (e, index, isPod) => {
    e.stopPropagation();
    setColorImage('color')
    setShowModel(true);
    if (isPod) {
      setSelectedPod(isPod)
      setSelectedTileDetail(pods[isPod.podIndex].tiles[isPod.tileIndex])
    } else {
      setSelectedTile(index)
      setSelectedTileDetail(tileCordinates[index])
    }
  }

  const enterText = (e) => {
    const values = formValue
    values.tileText = e.target.value
    setFormValue(values)
  }
  const enterLink = (e) => {
    const values = formValue
    values.tileLink = e.target.value
    setFormValue(values)
  }

  const handleSave = (index) => {
    let formData = new FormData;
    let payload = formValue

    for (let key in payload) {
      formData.append(key, payload[key]);
    }

    if (selectedPod) {
      let podIndex = selectedPod.podIndex
      let tileIndex = selectedPod.tileIndex
      let items = [...pods]
      let pod = items[podIndex]
      let changeTile = pod.tiles[tileIndex]
      let tileId = changeTile._id      
      setFormValue({})
      setImageFileName(null)
      setShowModel(false)
      setSelectedPod(null)
      axios.patch(`/api/tile/${tileId}`, formData).then((res) => {
        items[podIndex].tiles[tileIndex] = res.data
        setPods(items)
      })
      return
    }
    let items = [...tileCordinates];
    let tileId = items[selectedTile]._id
    setFormValue({})
    setSelectedTile(null)
    setImageFileName(null)
    setShowModel(false)

    axios.patch(`/api/tile/${tileId}`, formData
    ).then((res) => {
      let item = { ...items[selectedTile], ...res.data };
      items[selectedTile] = item;
      setTileCordinates(items)
    })
  }

  const deleteTile = (index) => {
    if (selectedPod) {
      let podIndex = selectedPod.podIndex
      let tileIndex = selectedPod.tileIndex
      let items = [...pods]
      let pod = items[podIndex]
      let tiles = pod.tiles
      let tileId = tiles[tileIndex]._id
      setShowModel(false)
      setSelectedPod(null)
        axios.delete(`/api/tile/${tileId}`).then((res) => {
          if (res) {
            tiles.splice(tileIndex, 1)
            if(tiles.length == 1){
              deletePod(podIndex)
              let tile = tiles[0]
              setTileCordinates([...tileCordinates , tile])
            }
            else{
              items[podIndex].tiles = tiles
              setPods(items)
            }
          }
        })    
      return
    }
    let tileId = tileCordinates[index]._id
    setShowModel(false)
    axios.delete(`/api/tile/${tileId}`).then((res)=>{
      if(res){
        tileCordinates.splice(index, 1)
        setTileCordinates([...tileCordinates])
      }
    })
  }

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImageFileName(selectedImage.name)
    const values = formValue
    values.tileImage = selectedImage
    setFormValue(values)
  };

  const handleImageInput = event => {
    hiddenFileInput.current.click();
  };

  const handleColorChange = (color) => {
    const values = formValue
    values.tileColor = color.hex
    setFormValue(values)
  }

  const style = (index) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "solid 1px #ddd",
      background: tileCordinates[index].tileColor ? tileCordinates[index].tileColor : "pink",
      color: 'black',
      overflowWrap: 'anywhere',
      borderRadius: '10px',
      margin: '10px 20px'
    }

    return stylevalue

  }

  // const style = {
  //    display: "flex",
  //     alignItems: "center",
  //     justifyContent: "center",
  //     border: "solid 1px #ddd",
  //      background: 'pink',
  //     //background: savedItem !== `tiles_${index}` ? "pink" : colorpicked,
  //     color: 'black',
  //     borderRadius: '10px' ,
  //     margin: '10px 20px'
  // }


  const changedTitlehandle = (index) => {
    let tileText = tileCordinates[index].tileText
    const titleVal = tileCordinates[index].tileText ? tileText : "Tiles"
    return titleVal
  }


  const setLinkRedirection = (e, link, tileContent, index, isPod) => {
    if (e.detail == 2 && link) {
      window.open(link, '_blank');
    }
    else if (e.detail == 2 && !link) {
      setOpenTextEdior(true)
      setTextEditorContent(tileContent)
      if (isPod) {
        setSelectedPod(isPod)
      } else {
        setSelectedTile(index)
      }

    }
  }
  const podStyle = (index) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      flexDirection: 'row',
      justifyContent: "space-around",
      padding: "10px",
      border: "dashed 1px black",
      borderRadius: "20px",
      margin: '10px 20px',
    }

    return stylevalue
  }
  const innerTileStyle = (tile) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: tile.tileColor ? tile.tileColor : "pink",
      flex: "1 1 100%",
      border: '1px solid #bbb',
      borderRadius: '20px',
      height: '100%',
      margin: ' 0 5px',
      cursor: 'grabbing',
      position: 'relative',
      minHeight : '120px',
      minWidth : '120px'
    }
    return stylevalue
  }
  const createPods = (dragTile, dropTile , direction) => {
    console.log("=====>>>..",direction)
    let tiles = tileCordinates
    let removableTileIds = [dragTile._id, dropTile._id]
    const filteredArray = tiles.filter(obj => !removableTileIds.includes(obj._id));
    setTileCordinates(filteredArray)

    const newPod = {
      isPod: true,
      x: dropTile.x,
      y: dropTile.y,
      height: 185,
      width: 325,
      tiles: [dropTile, dragTile],
      dashboardId : activeBoard
    };
    axios.post('api/pod/createPod',newPod).then((res)=> {
      let data = res.data
      data.tiles = [dropTile , dragTile]
      setPods([...pods , data])
    })
  }

  const updatePods = (dragtile, droppablePod) => {

    let dragTileIndex = tileCordinates.findIndex(obj => obj._id === dragtile._id)
    let tiles = tileCordinates
    tiles.splice(dragTileIndex,1)
    setTileCordinates(tiles)

    let tempPods = pods
    let objIndex = tempPods.findIndex(obj => obj._id === droppablePod._id)
    if (objIndex !== -1) {
      tempPods[objIndex].tiles.push(dragtile);
    }
    setPods(tempPods)
    var payload = {
      isAdd : true,
      tileId : dragtile._id,
      podId : droppablePod._id
    }
    axios.post('api/pod/addTile',payload).then((res)=>{
      if(res.data){
        console.log(res.data)
      }
    })
  }

  const handleDragStop = (e, data, tile, index) => {

    const tileBounds = document
      .getElementById(tile._id)
      .getBoundingClientRect();

    const overlappingPod = pods.find((pod) => {
      const nearPodBound = document
        .getElementById(pod._id)
        .getBoundingClientRect();
      return (
        tileBounds.left <= nearPodBound.right &&
        tileBounds.right >= nearPodBound.left &&
        tileBounds.top <= nearPodBound.bottom &&
        tileBounds.bottom >= nearPodBound.top
      );
    })

    if (overlappingPod) {
      updatePods(tile, overlappingPod)
      return
    }

    let direction
    const overlappingTile = tileCordinates.find((nearTile) => {
      const nearTileBound = document
        .getElementById(nearTile._id)
        .getBoundingClientRect();

      if (nearTile._id === tile._id) {
        return false;
      }

      const deltaX = tileBounds.left - nearTileBound.left;
      const deltaY = tileBounds.top - nearTileBound.top;
  
      direction =
        Math.abs(deltaX) > Math.abs(deltaY)
          ? deltaX > 0
            ? "horizontal"
            : "horizontal"
          : deltaY > 0
          ? "vertical"
          : "vertical";

      return (
        tileBounds.left <= nearTileBound.right &&
        tileBounds.right >= nearTileBound.left &&
        tileBounds.top <= nearTileBound.bottom &&
        tileBounds.bottom >= nearTileBound.top
      );


    });

    if (overlappingTile) {
      createPods(tile, overlappingTile , direction)
    } else {
      const { x, y } = data;
      e.preventDefault();
      let items = [...tileCordinates];
      let tileId = tileCordinates[index]._id
      let toUpdate = {
        x: x,
        y: y
      }
      let item = { ...items[index], ...toUpdate };
      items[index] = item;
      setTileCordinates(items)
      axios.patch(`/api/tile/${tileId}`, toUpdate).then((res) => {
        if (res.data) {
          console.log("update Drag Coordinate")
        }
      })

    }

  }



  const handleResizeStop = (e, direction, ref, delta, position, index) => {
    e.preventDefault();
    let items = [...tileCordinates];
    let tileId = tileCordinates[index]._id
    let toUpdate = {
      width : ref.style.width,
      height : ref.style.height,
    }
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setTileCordinates(items)
    axios.patch(`/api/tile/${tileId}`, toUpdate).then((res) => {
      if(res.data){
        console.log("update resize")
      }
    })
  }
  const handlePodDragStop = (e, data, pod, index) => {
   const { x, y } = data;
      e.preventDefault();
      let items = [...pods];
      let podId = pods[index]._id
      let toUpdate = {
        x: x,
        y: y
      }
      let item = { ...items[index], ...toUpdate };
      items[index] = item;
      setPods(items)
      axios.patch(`/api/pod/${podId}`, toUpdate).then((res) => {
        if (res.data) {
          console.log("update Drag Coordinate")
        }
      })
  }

  const handlePodResizeStop = (e, direction, ref, delta, position, index) => {
    let items = [...pods];
    let podId = pods[index]._id
    let toUpdate = {
      width : ref.style.width,
      height : ref.style.height,
    }
    let item = { ...items[index], ...toUpdate };
    items[index] = item;
    setPods([...items])
    axios.patch(`/api/pod/${podId}`,toUpdate).then((res) => {
      if(res.data){
        console.log('update resize')
      }
    })
  }


  const addBoard = () => {
    setShowDashboardModel(false)
    axios.post('/api/dashboard/addDashboard', {
      name: dashBoardName,
      userId: dbUser._id
    }).then((res)=> {
      setBoards([...boards, res.data])
    })  
  }

  const handleCloseTextEditor = (content) => {
    setOpenTextEdior(false)
    setTextEditorContent(null)
    setSelectedTile(null)
    setSelectedPod(null)
  }

  const updateEditorContent = (content) => {
    if (selectedPod) {
      let podIndex = selectedPod.podIndex
      let tileIndex = selectedPod.tileIndex
      let items = [...pods]
      let pod = items[podIndex]
      let changeTile = pod.tiles[tileIndex]
      let tileId = changeTile._id
      
      setSelectedPod(null)
      setOpenTextEdior(false)
      setTextEditorContent(null)
      axios.patch(`/api/tile/${tileId}`, {tileContent : content}).then((res) => {
        items[podIndex].tiles[tileIndex].tileContent = content
        setPods(items)
      })
      return
    }

    let items = [...tileCordinates];
    let tileId = items[selectedTile]._id
    setSelectedTile(null)
    setTextEditorContent(null)
    setOpenTextEdior(false)
    axios.patch(`/api/tile/${tileId}`, {tileContent : content}).then((res) => {
      let item = { ...items[selectedTile], ...res.data };
      items[selectedTile] = item;
      setTileCordinates(items)
    })
  }

  const onSortEnd = (tileList, pod ,podIndex) => {
    const tileListIdArray = tileList.map((tile)=>{
      return tile._id
    }) 
    pod['tiles'] = tileList
    let podsArray = [ ...pods ]
    podsArray[podIndex] = pod 
    setPods(podsArray)
    if(pod._id && pod.tiles.length == tileListIdArray.length ){
      axios.patch(`api/pod/${pod._id}`,{tiles : tileListIdArray}).then((res) => {
        console.log("update indexing success")
      })
    }
  };

  const deletePod = (index) => {
    let podId = pods[index]._id
    let podsArray = [ ...pods ]
    podsArray.splice(index , 1)
    setPods(podsArray)
    axios.delete(`/api/pod/${podId}`).then((res) => {
      console.log("===>>",res.data);
    })
  }

  const removeTileFromPod = (event, pod ,podIndex) => {
    const { oldIndex, newIndex, originalEvent } = event
    let dragType = originalEvent.type
    let tile = pod.tiles[newIndex]
    if (dragType === 'dragend') {

      if(pod.tiles.length === 2){
        let tiles = pod.tiles
        deletePod(podIndex)
        let freeTiles = [...tileCordinates]
        freeTiles = [...tileCordinates, ...tiles]
        setTileCordinates(freeTiles)
      }
      else{  
      pod.tiles.splice(newIndex, 1)
      onSortEnd(pod.tiles, pod, podIndex)
      let freeTiles = [...tileCordinates]
      freeTiles = [...tileCordinates, tile]
      setTileCordinates(freeTiles)
      let payload = {
        isAdd : false,
        tileId : tile._id,
        podId : pod._id
      }
      axios.post('api/pod/addTile',payload).then((res)=>{
        if(res.data){
          console.log(res.data)
        }
      })
      }
    }
  }

  const changeDashboardName =(e) =>{
    setDashBoardName(e.target.value)
  }

  const selectBoard = (e,dashboardId , board) => {
    if (e.detail == 2 && !board.default) {
      setDashboardUpdateId(dashboardId);
      setDashBoardName(board.name)
      setShowDashboardModel(true)
    } else {
      axios.get(`api/dashboard/${dashboardId}`).then((res) => {
        setTileCordinates(res.data.tiles)
        setPods(res.data.pods)
        setActiveBoard(dashboardId)
      })
    }
  }
  
  const updatedDashBoard = () => {
    setShowDashboardModel(false)
    const data= {
      name: dashBoardName,
    }
    axios.patch(`api/dashboard/${dashbardUpdateId}`,data).then((res) => {
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

  const deletDashboard = ( id , index) =>{
     axios.delete(`api/dashboard/${id}`).then((res) => {
      if(res){
        boards.splice(index,1)
        setBoards(boards)
      }
     })
  }

  return (
    <div className="main_grid_container">
      <div className='board_nav'>
        {boards.map((board, index) => {
          return (
            <List key={board._id}>
              <ListItem button 
              onMouseEnter={()=>setShowIcon(board._id) } 
              onMouseLeave={() => setShowIcon(null)}
              onClick={(e) => { selectBoard(e, board._id ,board) }} >
                <ListItemText primary={board.name} 
                primaryTypographyProps={{
                  style: { fontWeight: board._id === activeBoard ? 'bold' : 'normal' },
                }}
                />
                {(showIcon === board._id && !board.default && board._id !== activeBoard ) &&
                <span className="cross" onClick={()=>{deletDashboard(board._id , index)}}>
                  x
                </span>}
              </ListItem>
            </List>
          )
        })}
        <Button sx={{ p: '11px' }} onClick={() => {
          setShowDashboardModel(true); 
          setDashboardUpdateId(null) ;
          setDashBoardName('')}}>+ New</Button>
      </div>
      <div className="add_tiles" onClick={addTiles}>
        <AddSharpIcon />
      </div>

      <div className="tiles_container">
        {pods.map((pod, index) => (
          <div className='pods' key={pod._id} >
            <Rnd
              style={podStyle(index)}
              size={{ width: pod.width, height: pod.height }}
              position={{ x: pod.x, y: pod.y }}
              disableDragging={disableDrag}
              onDragStop={(e, d) => handlePodDragStop(e, d, pod, index)}
              onResizeStop={(e, direction, ref, delta, position) => handlePodResizeStop(e, direction, ref, delta, position, index)}
              id={pod._id}
              minWidth = {120*pod.tiles.length+ pod.tiles.length*20+20}
              minHeight = {120+20}
              bounds="window"
            >
                <ReactSortable
                  filter=".addImageButtonContainer"
                  dragClass="sortableDrag"
                  list={pod.tiles}
                  setList={(list) =>  onSortEnd(list, pod , index) }
                  animation="200"
                  easing="ease-out" style={{display : 'contents'}}
                  onEnd={(evt) =>removeTileFromPod(evt, pod, index)} 
                >
                  {pod.tiles.map((tile, tileIndex) => (
                    <div className='innerTile' key={tile._id} style={innerTileStyle(tile)}
                      onClick={(e) => setLinkRedirection(e, tile.tileLink, tile.tileContent, index, { podIndex: index, tileIndex: tileIndex })}
                      onMouseEnter={() => { setShowOption(`pod_${index}_tile_${tileIndex}`); setDisableDrag(true) }}
                      onMouseLeave={() => { setShowOption(null); setDisableDrag(false) }}
                    >
                      {showOption === `pod_${index}_tile_${tileIndex}` &&
                        <div className='showPodTileOptions'
                          onClick={(e) => { openModel(e, index, { podIndex: index, tileIndex: tileIndex }) }}>
                          <MoreHorizSharpIcon />
                        </div>}
                      {!tile.tileImage && <span>{tile.tileText ? tile.tileText : 'Tiles'}</span>}
                      {tile.tileImage && < img className='podTilesImage' src={tile.tileImage} alt="Preview" />}
                    </div>
                  )
                  )}
                </ReactSortable>
            </Rnd>
          </div>
        )
        )}
        {tileCordinates.map((tile, index) => (
          <div className='relative' key={index}>
            <Rnd
              onMouseEnter={() => setShowOption(`tiles_${index}`)}
              onMouseLeave={() => setShowOption(null)}
              style={style(index)}
              size={{ width: tile.width, height: tile.height }}
              position={{ x: tile.x, y: tile.y }}
              onDragStop={(e, d) => handleDragStop(e, d, tile, index)}
              onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(e, direction, ref, delta, position, index)}
              onClick={(e) => setLinkRedirection(e, tile.tileLink, tile.tileContent, index, null)}
              minWidth = {120}
              minHeight = {120}
              id={tile._id}
              bounds="window"
            >
              {tileCordinates[index].tileImage ? '' : changedTitlehandle(index)}
              {tileCordinates[index].tileImage && <img draggable="false" src={tileCordinates[index].tileImage} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '10px' }} />}
              {showOption === `tiles_${index}` && <div className="showOptions absolute top-0 right-2 cursor-pointer " onClick={(e) => openModel(e, index, null)}>
                <MoreHorizSharpIcon />
              </div>}
            </Rnd>
          </div>
        )
        )}
    </div>

      {/* Tiles Property Model */ }
      <Dialog  open={showModel} id={`model_${selectedTile}`}>
        <DialogContent sx={{width:'600px'}}>
          <h3>Choose to customize your tiles
            <span onClick={() => {
              setShowModel(false); setSelectedPod(null);
              setFormValue({}); setSelectedTile(null); setImageFileName(null)
            }}
              className="absolute top-4 right-7 cursor-pointer"><CloseSharpIcon />
            </span></h3>
          <div className="radiosets">
            <FormControl>

              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue="color"
                name="radio-buttonsColor"
                onChange={handleColorImage}
              >
                <FormControlLabel value="color" control={<Radio />} label="Color" />
                <FormControlLabel value="image" control={<Radio />} label="Image" />

              </RadioGroup>
            </FormControl>
          </div>
          <div className="radiosets">
            <FormControl>

              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue={textLink}
                name="radio-buttonsLink"
                onChange={handleTextLink}
              >
                <FormControlLabel value="link" control={<Radio />} label="Link" />
                <FormControlLabel value="text" control={<Radio />} label="Text" />

              </RadioGroup>
            </FormControl>
          </div>

          <div className="all_options">
            <ul>
              {colorImage === 'color' &&
                <li>
                  <ColorPicker handleColorChange={handleColorChange} />
                </li>}
              {textLink === 'text' &&
                <li>
                  <span><TitleSharpIcon /></span>
                  <span>Box Title</span>
                  <input type="text"
                    value={formValue.tileText}
                    defaultValue={selectedTileDetail.tileText}
                    onChange={enterText} />
                </li>}
              {textLink === 'link' &&
                <li>
                  <span><AddLinkSharpIcon /></span>
                  <span>Box Link</span>
                  <input type="text"
                    value={formValue.tileLink}
                    defaultValue={selectedTileDetail.tileLink}
                    onChange={enterLink} />
                </li>}
              {colorImage == 'image' &&
                <li>
                  <span onClick={handleImageInput}><AddPhotoAlternateIcon /></span>
                  <span onClick={handleImageInput}>Add Image</span>
                  <span style={{ fontSize: '13px' }}>{imageFileName}</span>
                  <input type="file" accept="image/*" ref={hiddenFileInput}
                    style={{ display: "none" }} onChange={handleImageChange} />
                </li>}
              <li>
                <span onClick={() => deleteTile(selectedTile)}><DeleteSweepSharpIcon /></span>
                <span onClick={() => deleteTile(selectedTile)}>Delete</span>
              </li>
            </ul>
            <button className="bg-blue-500 text-base hover:bg-blue-700 text-white font-bold py-3 px-8 rounded border-0" onClick={(index) => handleSave(`tiles_${selectedTile}`)}>Save</button>
          </div>

        </DialogContent>
      </Dialog>
      <TextEditor open={openTextEditor}
        onClose={handleCloseTextEditor}
        content={textEditorContent}
        onSave={updateEditorContent}
      />

      {/* DashBoard Model */}
      <Dialog open={showDeshboardModel}  >
          <DialogTitle>Add Dashboard</DialogTitle>
          <span className="absolute top-4 right-7 cursor-pointer"
            onClick={()=> setShowDashboardModel(false)}>
            <CloseSharpIcon />
          </span>
          <DialogContent sx={{width:"300px"}}>
          <input type="text"
            value={dashBoardName}
            defaultValue=''
            placeholder='Enter Dashboard Name'
            onChange={changeDashboardName}
            style={{ height:'40px', width:'100%'}}
          />
        </DialogContent> 
        <DialogActions>
         { dashbardUpdateId ? <Button onClick={()=>{updatedDashBoard()}} >Update</Button>
          : <Button onClick={()=>{addBoard()}}>Save</Button>}
        </DialogActions>
      </Dialog>
    </div >
  );
}