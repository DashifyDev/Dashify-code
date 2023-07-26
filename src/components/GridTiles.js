"use client";
'use strict'
import AddSharpIcon from '@mui/icons-material/AddSharp';
import dynamic from 'next/dynamic';
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
import DifferenceIcon from '@mui/icons-material/Difference';
import { ChromePicker } from 'react-color';
import ColorPicker from './ColorPicker';
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { Button, Dialog, DialogActions, DialogContent, Checkbox,
  DialogTitle, List, ListItem, ListItemText, } from '@mui/material';
import TextEditor from './TextEditor';
import { ReactSortable } from "react-sortablejs";
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { userContext } from '@/context/userContext';
import { v4 as uuidv4 } from 'uuid';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import 'suneditor/dist/css/suneditor.min.css'; 
import { fonts,colors } from '@/constants/textEditorConstant';
const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});

export default function GridTiles( {defaultDashboard} ) {
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
  const [selectedDashboard, setSelectedDashboard] = useState(null)
  const [editorLabel, setEditorLabel] = useState()
  const [openDashDeleteModel, setOpenDashDeleteModel] = useState(false)
  const [selectedDashIndex , setSelectedDashIndex] = useState(null)

  const { dbUser } = useContext(userContext)
  const hiddenFileInput = useRef(null)
  const { isLoading,user } = useUser()

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
            setPods(res.data.pods)
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

  const addTiles = () => {
    const tileWidth = 135; 
  const tileHeight = 135; 
  const tileMargin = 10; 
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Check if there's an available space in the first row
  let foundEmptySpace = false;
  let newRowY = -50;
  let newX = 100;

  for (let x = 100; x <= windowWidth - tileWidth; x += tileWidth + tileMargin) {
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
      newX = 50;
      newY = 95

      if (newY + tileHeight > windowHeight) {
        newX = 100;
        newY = -50;
      }
    } else {
      newX = 100;
      newY = -50;
    }
  }
  if (newX + tileWidth > windowWidth) {
    newX = 50;
    newY += tileHeight + tileMargin;
    if (newY + tileHeight > windowHeight) {
      newX = 100;
      newY = -50;
    }
  }
  
    const newtile = {
      dashboardId: activeBoard,
      width: '135px',
      height: '135px',
      x: newX,
      y: newY
    }
    if(dbUser){
      axios.post('/api/tile/tile', newtile ).then((res)=>{
        console.log("====>>>",res.data)
        setTileCordinates([...tileCordinates , res.data])
      })
    }
    else{
      let items = [...tileCordinates,newtile]
      updateTilesInLocalstorage(items)
      setTileCordinates(items)
    }
  }

  const updateTilesInLocalstorage= (tileArray) => {
    let items = boards
    let boardIndex = items.findIndex(obj => obj._id === activeBoard);
    let item = items[boardIndex]
    item.tiles = tileArray
    items[boardIndex] = item
    localStorage.setItem("Dasify",JSON.stringify(items))
  }


  const handleColorImage = (e) => {
    setColorImage(e.target.value)
  }

  const handleTextLink = (e) => {
    setTextLink(e.target.value)
  }

  const openModel = (e, index, isPod) => {
    e.stopPropagation();
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
    values.tileText = e
    setFormValue(values)
  }
  const enterLink = (e) => {
    const values = formValue
    values.tileLink = e.target.value
    setFormValue(values)
  }

  const showTitleWithImage = (e) => {
    setSelectedTileDetail({...selectedTileDetail, showTitleWithImage : e.target.checked})
    let value = formValue
    setFormValue({...value, showTitleWithImage : e.target.checked})
  }

  const handleSave = (index) => {
    let formData = new FormData;
    let payload = formValue
    if(payload.tileImage instanceof File){
      formData.append('tileImage', payload.tileImage)
      delete payload.tileImage
    }
    formData.append('formValue',JSON.stringify(payload))

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
    setImageFileName(null)
    setShowModel(false)
    if (dbUser) {
      axios.patch(`/api/tile/${tileId}`, formData
      ).then((res) => {
        let item = { ...items[selectedTile], ...res.data };
        items[selectedTile] = item;
        setTileCordinates(items)
        setSelectedTile(null)
      })
    }else{
      axios.patch('api/tile/updateTile',formData).then((res) => {
        let item = { ...items[selectedTile], ...res.data }; 
        items[selectedTile] = item;
        setTileCordinates(items)
        updateTilesInLocalstorage(items)
      })
    }
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
    if(dbUser){
      axios.delete(`/api/tile/${tileId}`).then((res)=>{
        if(res){
          tileCordinates.splice(index, 1)
          setTileCordinates([...tileCordinates])
        }
      })
    }
    else{
      let items = tileCordinates
      items.splice(index,1)
      setTileCordinates(items)
      updateTilesInLocalstorage(items)
    }
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

  const style = (index,tile) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "solid 1px #ddd",
      background: tileCordinates[index].tileColor ? tileCordinates[index].tileColor : "pink",
      color: 'black',
      overflowWrap: 'anywhere',
      borderRadius: '10px',
    }

    return stylevalue

  }

  const changedTitlehandle = (index) => {
    let tileText = tileCordinates[index].tileText
    let content
    if(tileText){
      const parser = new DOMParser();
      const doc = parser.parseFromString(tileText, 'text/html');
      content = doc.getElementsByTagName('div')[0].innerText;
    }
    const titleVal = content ? tileText : "Tiles"
    return titleVal
  }


  const onDoubleTap = (e, link, tileContent, tile ,index, isPod) => {
    if ((e.type === "touchstart" || e.detail == 2) && link) {
      window.open(link, '_blank');
    }
    else if ((e.type === "touchstart" || e.detail == 2) && !link) {
      let label = tile.tileText
      setEditorLabel(label)
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
      if (dbUser){
        axios.patch(`/api/tile/${tileId}`, toUpdate).then((res) => {
          if (res.data) {
            console.log("update Drag Coordinate")
          }
        })
      }else{
        updateTilesInLocalstorage(items)
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
    if(dbUser){
      axios.patch(`/api/tile/${tileId}`, toUpdate).then((res) => {
        if(res.data){
          console.log("update resize")
        }
      })
    }
    else{
      updateTilesInLocalstorage(items)
    }
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
    setTextEditorContent(null)
    setOpenTextEdior(false)
    if(dbUser){
      axios.patch(`/api/tile/${tileId}`, {tileContent : content}).then((res) => {
        let item = { ...items[selectedTile], ...res.data };
        items[selectedTile] = item;
        setTileCordinates(items)
        setSelectedTile(null)
      })
    }
    else{
      let item = { ...items[selectedTile], tileContent : content }
      items[selectedTile] = item;
      setTileCordinates(items)
      updateTilesInLocalstorage(items)
      setSelectedTile(null)
    }
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

  const tileClone = (index) => {
    let content = tileCordinates[index]

    const newTileWidth = parseInt(content.width); 
    const newTileMargin = 5;
    const windowWidth = window.innerWidth;
    const maxTileX = windowWidth - newTileWidth - newTileMargin-10;
    let newTileX = content.x + newTileWidth + newTileMargin;

    if (newTileX > maxTileX) {
      newTileX = content.x-newTileWidth-newTileMargin;
    }
  
    const newTile = {
      ...content,
      x: newTileX,
      y: content.y
    };
  
    setShowModel(false)
    if(dbUser){
      newTile.dashboardId=activeBoard
      axios.post('/api/tile/tile', newTile ).then((res)=>{
        setTileCordinates([...tileCordinates , res.data])
      })
    }
    else{
      let items = [...tileCordinates, newTile]
      setTileCordinates(items)
      updateTilesInLocalstorage(items)
    }
  }

  const changeDashboardName =(e) =>{
    setDashBoardName(e.target.value)
  }

  const selectBoard = (e,dashboardId , board , index) => {
    if (e && (e.type === "touchstart" || e.detail == 2) && !board.default) {
      setSelectedDashboard(dashboardId);
      setDashBoardName(board.name)
      setShowDashboardModel(true)
    } else {
      if (dbUser) {
        axios.get(`api/dashboard/${dashboardId}`).then((res) => {
          setTileCordinates(res.data.tiles)
          setPods(res.data.pods)
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

  const onResize = (index,e,direction, ref, delta, position) => {
    console.log(e)
    const tile = tileCordinates[index];
    if (tile && ref) {
      const contentElement = ref.querySelector('.text_overlay')
      const contentWidth = contentElement.scrollWidth;
      const contentHeight = contentElement.scrollHeight;
      const boxWidth = parseInt(ref.style.width); 
      const boxHeight = parseInt(ref.style.height);
      if(contentWidth >= boxWidth || contentHeight >= boxHeight){
        ref.style.width = contentWidth + 'px'
        ref.style.height = contentHeight + 'px'
      }
    }
  }

  return (
    <div className="main_grid_container">
      <div className='board_nav'>
      <ReactSortable
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
              onMouseEnter={()=>setShowIcon(board._id) } 
              onMouseLeave={() => setShowIcon(null)}
              onClick={(e) => { selectBoard(e, board._id ,board , index) }}
              onTouchStart={(e) => {if (isDblTouchTap(e)) {
                selectBoard(e, board._id ,board , index)
              }
              }} >
                <ListItemText primary={board.name} 
                primaryTypographyProps={{
                  style: { fontWeight: board._id === activeBoard ? 'bold' : 'normal' },
                }}
                />
                {(showIcon === board._id && !board.default && board._id !== activeBoard ) &&
                <span className="cross" 
                onClick={()=>{setOpenDashDeleteModel(true),
                setSelectedDashboard(board._id)
                setSelectedDashIndex(index)}}>
                  x
                </span>}
              </ListItem>
            </List>
          )
        })}
        </ReactSortable>
        
        <Button className='dashboard_btn' sx={{ p: '11px' }} onClick={() => {
          setShowDashboardModel(true); 
          setSelectedDashboard(null) ;
          setDashBoardName('')}}>+ New</Button>
          </div>
      <div className="add_tiles" onClick={addTiles}>
        <AddSharpIcon />
      </div>

      <div className="tiles_container">
        {tileCordinates.map((tile, index) => (
            <Rnd
              key={index}
              onMouseLeave={() => setShowOption(null)}
              className='tile'
              style={style(index,tile)}
              size={{ width: tile.width, height: tile.height }}
              position={{ x: tile.x, y: tile.y }}
              onDragStop={(e, d) => handleDragStop(e, d, tile, index)}
              onResizeStop={(e, direction, ref, delta, position) => handleResizeStop(e, direction, ref, delta, position, index)}
              onDoubleClick={(e) => onDoubleTap(e, tile.tileLink, tile.tileContent,tile, index, null)}
              minWidth = {50}
              minHeight = {50}
              id={tile._id}
              bounds=".main_grid_container"
              dragGrid={[5,5]}
              onTouchStart={ (e) => {
                if (isDblTouchTap(e)) {
                  onDoubleTap(e, tile.tileLink, tile.tileContent,tile, index, null)
                }
                else{
                  setShowOption(`tile_${index}`)
                }
              }}
            > 
              {(!tile.tileImage || (tile.tileImage && tile.showTitleWithImage)) && 
              <div className='text_overlay' dangerouslySetInnerHTML={{ __html:  changedTitlehandle(index) }}></div>}
              {tileCordinates[index].tileImage && <img draggable="false" src={tileCordinates[index].tileImage} alt="Preview" />}
              <div className="showOptions absolute top-0 right-2 cursor-pointer " onClick={(e) => openModel(e, index, null)}>
                <MoreHorizSharpIcon />
              </div>
              {showOption == `tile_${index}` && <div className="absolute top-0 right-2 cursor-pointer " onTouchStart={(e) => openModel(e, index, null)}>
                <MoreHorizSharpIcon />
              </div>} {/* For Mobile view port  */}
            </Rnd>
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
                defaultValue={colorImage}
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
                  <span>Tile Title</span>
                  <span className='highlight_text'>(Highlight text to edit)</span>
                  <SunEditor 
                    value={formValue.tileText}
                    defaultValue={selectedTileDetail.tileText}
                    onChange={enterText}
                    
                    setOptions={{
                      buttonList: [
                        [ "bold","underline","italic","strike",],
                        ["font", "fontSize","fontColor"],
                      ],
                      defaultTag: "div",
                      font: fonts,
                      colorList :colors,
                      showPathLabel: false,
                    }} 
                      width='71%'
                    />
                </li>}
              {textLink === 'link' &&
                <li>
                  <span><AddLinkSharpIcon /></span>
                  <span>Tile Link</span>
                  <input type="text"
                    value={selectedTileDetail.tileLink}
                    onChange={enterLink} />
                </li>}

              {colorImage == 'image' &&
                <li>
                  <FormControlLabel sx={{ marginLeft: 0 }}
                    control={
                      <Checkbox
                        checked={selectedTileDetail.showTitleWithImage}
                        onChange={showTitleWithImage}
                        disabled={!formValue.tileImage && !selectedTileDetail.tileImage}
                      />
                    }
                    label="Display Title"
                  />
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
              <li>
                <span onClick={() => tileClone(selectedTile)}><DifferenceIcon /></span>
                <span onClick={() => tileClone(selectedTile)}>Duplicate</span>
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
        label={editorLabel}
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
            placeholder='Enter Dashboard Name'
            onChange={changeDashboardName}
            style={{ height:'40px', width:'100%'}}
          />
        </DialogContent> 
        <DialogActions>
         { selectedDashboard ? <Button onClick={()=>{updatedDashBoard()}} >Update</Button>
          : <Button onClick={()=>{addBoard()}}>Save</Button>}
        </DialogActions>
      </Dialog>

        {/* Delete DashBoard Model */}
      <Dialog open={openDashDeleteModel}>
        <DialogContent sx={{width:"320px"}}>
          Are you sure you want to delete?
        </DialogContent> 
        <DialogActions>
          <Button onClick={()=>{setOpenDashDeleteModel(false),setSelectedDashIndex(null)}}>Cancel</Button>
          <Button variant="contained" 
          onClick={()=>{deleteDashboard(selectedDashboard,selectedDashIndex)}}>
          Delete</Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}