"use client";
'use strict'
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef, useContext } from 'react';
import '../styles/styles.css'
import { Rnd } from "react-rnd";
import MoreHorizSharpIcon from '@mui/icons-material/MoreHorizSharp';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import ColorPicker from './ColorPicker';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Dialog, Button} from '@mui/material';
import TextEditor from './TextEditor';
import axios from 'axios';
import { userContext } from '@/context/userContext';
import isDblTouchTap from '@/hooks/isDblTouchTap';
import 'suneditor/dist/css/suneditor.min.css'; 
import { fonts,colors } from '@/constants/textEditorConstant';
import imageUpload from '../assets/imageUpload.jpg'

import Image from 'next/image';
const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});

export default function GridTiles({tileCordinates, setTileCordinates,activeBoard ,updateTilesInLocalstorage}) {
  const [showOption, setShowOption] = useState(null);
  const [showModel, setShowModel] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedPod, setSelectedPod] = useState(null)
  const [colorImage, setColorImage] = useState('color')
  const [textLink, setTextLink] = useState('text')
  const [imageFileName, setImageFileName] = useState(null)
  const [formValue, setFormValue] = useState({})
  const [pods, setPods] = useState([])
  const [openTextEditor, setOpenTextEdior] = useState(false)
  const [selectedTileDetail, setSelectedTileDetail] = useState({})
  const [textEditorContent, setTextEditorContent] = useState()
  const [editorLabel, setEditorLabel] = useState()
  const [minHeightWidth, setMinHeightWidth] = useState([]);
  const [resizeCount, setResizeCount] = useState(0)

  const { dbUser } = useContext(userContext)
  const hiddenFileInput = useRef(null)

  useEffect(()=>{
    setMinHeightWidth(tileCordinates.map(() => ({ width: 50, height: 50 })));
  },[tileCordinates])

  const handleColorImage = (e) => {
    setColorImage(e.target.value)
  }

  const changeAction = (e) => {
    setSelectedTileDetail({...selectedTileDetail, action : e.target.value})
    const values = formValue
    values.action = e.target.value
    setFormValue(values)
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
    setSelectedTileDetail({...selectedTileDetail, tileLink : e.target.value})
    const values = formValue
    values.tileLink = e.target.value
    setFormValue(values)
  }

  const showTitleWithImage = (e) => {
    setSelectedTileDetail({...selectedTileDetail, showTitleWithImage : e.target.checked})
    let value = formValue
    setFormValue({...value, showTitleWithImage : e.target.checked})
  }

  const handleChangePositionX = (e) => {
    setSelectedTileDetail({...selectedTileDetail, titleX : e.target.value})
    const values = formValue
    values.titleX = parseInt(e.target.value)
    setFormValue(values)
  }

  const handleChangePositionY = (e) => {
    setSelectedTileDetail({...selectedTileDetail, titleY : e.target.value})
    const values = formValue
    values.titleY = parseInt(e.target.value)
    setFormValue(values)
  }


  const handleSave = (index) => {
    let formData = new FormData;
    let payload = formValue
    if(payload.tileBackground instanceof File){
      formData.append('tileImage', payload.tileBackground)
      delete payload.tileBackground
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
    values.tileBackground = selectedImage
    setFormValue(values)
  };

  const handleImageInput = event => {
    hiddenFileInput.current.click();
  };

  const handleColorChange = (color) => {
    const values = formValue
    values.tileBackground = color.hex
    setFormValue(values)
  }

  const style = (index,tile) => {
    let isImageBackground 
    if(tile.tileBackground){
      isImageBackground = isBackgroundImage(tile.tileBackground)
    }

    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "solid 1px #ddd",
      background: tile.tileBackground && !isImageBackground ? tile.tileBackground : "pink",
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


  const onDoubleTap = (e, action, tileContent, tile ,index, isPod) => {
    if ((e.type === "touchstart" || e.detail == 2) && action=='link') {
      if(tile.tileLink){
        window.open(tile.tileLink, '_blank');
      }
    }
    else if ((e.type === "touchstart" || e.detail == 2) && action=='textEditor') {
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

  const onResize = (index,e,direction, ref, delta, position) => {
    const tile = tileCordinates[index];
    if (tile && ref) {
      const contentElement = ref.querySelector('.text_overlay')
      if (contentElement) {
        const contentWidth = contentElement.scrollWidth;
        const contentHeight = contentElement.scrollHeight;
        const boxWidth = parseInt(ref.style.width);
        const boxHeight = parseInt(ref.style.height);
        if ((resizeCount == 0) && (contentHeight >= boxHeight || contentWidth >= boxWidth)) {
          setResizeCount((prevCount) => {
            return prevCount + 1
          })

          setMinHeightWidth((prevSizes) => {
            const newSizes = [...prevSizes];
            newSizes[index] = { width: contentWidth, height: contentHeight };
            return newSizes;
          });
        }
      }
    }
  }
  
 
  const TitlePositionStyle = (tile) => {
    let style ={
      top : tile.titleY == 1 ? 0 : 'auto',
      bottom : tile.titleY == 3 ? 0 : 'auto',
      left : tile.titleX == 1 ? 0 : 'auto',
      right : tile.titleX == 3 ? 0 : 'auto'
    }
    return style
  }

  const isBackgroundImage = (url) => {
    if(url){
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      let isImage = imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
      return isImage
    }
  }


  return (
    <div className="main_grid_container">
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
              onDoubleClick={(e) => onDoubleTap(e, tile.action, tile.tileContent,tile, index, null)}
              minWidth = {minHeightWidth[index]?.width || 50}
              minHeight = {minHeightWidth[index]?.height || 50}
              onResize={(e, direction, ref, delta, position) =>
                onResize(index, e,direction, ref, delta, position)
              }
              bounds='.main_grid_container'
              id={tile._id}
              onResizeStart={()=>setResizeCount(0)}
              dragGrid={[5,5]}
              onTouchStart={ (e) => {
                if (isDblTouchTap(e)) {
                  onDoubleTap(e, tile.action, tile.tileContent,tile, index, null)
                }
                else{
                  setShowOption(`tile_${index}`)
                }
              }}
            > 
              {(!isBackgroundImage(tile.tileBackground) || (isBackgroundImage(tile.tileBackground) && tile.showTitleWithImage)) && 
              <div className='text_overlay' style={TitlePositionStyle(tile)} dangerouslySetInnerHTML={{ __html:  changedTitlehandle(index) }}></div>}
              {isBackgroundImage(tile.tileBackground) && <img draggable="false" src={tile.tileBackground} alt="Preview" />}
              <div className="showOptions absolute top-0 right-2 cursor-pointer" onClick={(e) => openModel(e, index, null)}>
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
        <div className='all_options'>
          <ul>
            <li>
              <h3 className='menu_header'>Tile Background</h3>
              <div className='radio_menu'>
                <div className="radiosets">
                  <FormControl>
                    <RadioGroup
                      aria-labelledby="demo-radio-buttons-group-label"
                      defaultValue={colorImage}
                      name="radio-buttonsColor"
                      onChange={handleColorImage}
                    >
                      <FormControlLabel value="color" control={<Radio />} label="Select Color" />
                      <FormControlLabel value="image" control={<Radio />} label="Upload Image" />
                    </RadioGroup>
                  </FormControl>
                </div>
                <div>
                  {colorImage === 'color' &&
                      <ColorPicker handleColorChange={handleColorChange} />
                  }
                  {colorImage === 'image' &&
                  <div className='image_value'>
                    <Image
                    src={imageUpload}
                    alt="image"
                    width={60} height={60}
                    onClick={handleImageInput}
                  />
                    {/* <span style={{ fontSize: '9px' }}>{imageFileName}</span> */}
                  </div>
                  } 
                  <input type="file" accept="image/*" ref={hiddenFileInput}
                    style={{ display: "none" }} onChange={handleImageChange} /> 
                </div>
              </div>
            </li>
            <li>
              <h3 className='menu_header'>Tile Action</h3>
              <div className='radio_control'>
                <div className="radiosets">
                  <FormControl>
                    <RadioGroup
                      aria-labelledby="demo-radio-buttons-group-label"
                      defaultValue= {selectedTileDetail.action}
                      name="radio-buttonsLink"
                      onChange={changeAction}
                    >
                      <FormControlLabel value="link" control={<Radio />} label="Opens Link" />
                      <FormControlLabel value="textEditor" control={<Radio />} label="Opens Text Editor" />
                      <FormControlLabel value="noAction" control={<Radio />} label="No Action" />
                    </RadioGroup>
                  </FormControl>
                  <input type="text" className='url_text'
                      value={selectedTileDetail.tileLink}
                      onChange={enterLink} 
                      placeholder='Add URL here'
                      disabled={selectedTileDetail.action !== 'link'}
                    />
                </div>
              </div>
            </li>
            <li>
              <h3 className='menu_header'>Tile Title</h3>
              <div className='title_editor'>
                <SunEditor
                  value={formValue.tileText}
                  defaultValue={selectedTileDetail.tileText}
                  onChange={enterText}
                  setOptions={{
                    buttonList: [
                      [ "bold","underline","italic"],
                      ["font", "fontSize"],
                      ["fontColor"],
                    ],
                    defaultTag: "div",
                    font: fonts,
                    colorList: colors,
                    showPathLabel: false,
                  }}
                  width='100%'
                />
                <div className='display_title'>
                  <div className='display_title_check'>
                    <input
                      type="checkbox"
                      checked={selectedTileDetail.showTitleWithImage}
                      onChange={showTitleWithImage}
                      disabled={!( typeof formValue.tileBackground == 'object') && 
                        !(isBackgroundImage(selectedTileDetail.tileBackground))
                      } 
                    />
                    <label>Dispaly Title</label>
                  </div>
                  <div className='position'>
                    <select value={selectedTileDetail.titleX} onChange={handleChangePositionX}>
                      <option value={1}>Left</option>
                      <option value={2}>Center</option>
                      <option value={3}>Right</option>
                    </select>
                    <select value={selectedTileDetail.titleY} onChange={handleChangePositionY}>
                      <option value={1}>Top</option>
                      <option value={2}>Center</option>
                      <option value={3}>Bottom</option>
                    </select>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          <div className='line_break'></div>
          <div className='menu_action'>
            <div>
              <div className='delete_duplicate_action'>
                <span onClick={() => tileClone(selectedTile)}><DifferenceOutlinedIcon /></span>
                <span onClick={() => tileClone(selectedTile)}>Duplicate</span>
              </div>
              <div  className='delete_duplicate_action'>
                <span onClick={() => deleteTile(selectedTile)}><DeleteOutlineIcon /></span>
                <span onClick={() => deleteTile(selectedTile)}>Delete</span>
              </div>
            </div>
            <div>
              <Button className='button_cancel' sx={{ color: '#63899e', marginRight:'3px' }}
                onClick={() =>{
                  setShowModel(false); setSelectedPod(null);
                  setFormValue({}); setSelectedTile(null); setImageFileName(null)
                }}>Cancel
              </Button>
              <Button className='button_filled'
                sx={{
                  background: '#63899e',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#63899e',
                  }
                }} onClick={(index) => handleSave(`tiles_${selectedTile}`)} >Save</Button>
            </div>
          </div>
        </div>
      </Dialog>
      <TextEditor open={openTextEditor}
        onClose={handleCloseTextEditor}
        content={textEditorContent}
        onSave={updateEditorContent}
        label={editorLabel}
      />

    </div >
  );
}