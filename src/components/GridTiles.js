"use client";
'use strict'
import AddSharpIcon from '@mui/icons-material/AddSharp';
import React, { useState, useEffect, useRef, Component } from 'react';
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
import { Button, Dialog, DialogContent, List, ListItem, ListItemText, } from '@mui/material';
import TextEditor from './TextEditor';
import { ReactSortable } from "react-sortablejs";

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
  const [content, setContent] = useState('')
  const [textEditorContent, setTextEditorContent] = useState()
  const [disableDrag, setDisableDrag] = useState(false);


  const hiddenFileInput = useRef(null)

  useEffect(() => {
    console.log("localStorage.getItem('coordinates')", localStorage.getItem('coordinates'))
    if (localStorage.getItem('pods')) {
      setPods(JSON.parse(localStorage.getItem('pods')))
    }
    if (localStorage.getItem('boards')) {
      setBoards(JSON.parse(localStorage.getItem('boards')))
    }
    if (localStorage.getItem('coordinates')) {
      setTileCordinates(JSON.parse(localStorage.getItem('coordinates')));
    } else {

      var timestamp1 = new Date().getTime().toString();
      var uniqueId1 = timestamp1.substr(timestamp1.length - 6);

      var timestamp2 = new Date().getTime().toString();
      var uniqueId2 = timestamp2.substr(timestamp2.length - 7);
      setTileCordinates([
        {
          id: uniqueId1,
          width: 200,
          height: 200,
          x: 10,
          y: 10
        },
        {
          id: uniqueId2,
          width: 200,
          height: 200,
          x: 300,
          y: 10
        },
      ])
    }
  }, []);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker)
  };

  const handleClose = () => {
    setDisplayColorPicker(false)
  };



  const addTiles = () => {
    const naturalNumberx = Math.floor(Math.random() * 1000);
    const naturalNumbery = Math.floor(Math.random() * 350)
    var timestamp = new Date().getTime().toString();
    var uniqueId = timestamp.substr(timestamp.length - 6);
    setTileCordinates([...tileCordinates, {
      id: uniqueId,
      width: 200,
      height: 200,
      x: naturalNumberx,
      y: naturalNumbery
    }])
    localStorage.setItem('coordinates', JSON.stringify(tileCordinates))
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
    console.log("===At Open Model=>>>>", pods, tileCordinates)
    e.stopPropagation();
    setColorImage('color')
    setTextLink('text')
    setShowModel(true);
    if (isPod) {
      setSelectedPod(isPod)
    } else {
      setSelectedTile(index)
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
    if (selectedPod) {
      let podIndex = selectedPod.podIndex
      let tileIndex = selectedPod.tileIndex
      let items = [...pods]
      let pod = items[podIndex]
      let changeTile = pod.tiles[tileIndex]
      items[podIndex].tiles[tileIndex] = { ...changeTile, ...formValue }
      localStorage.setItem('pods', JSON.stringify(items))
      setPods(items)
      setFormValue({})
      setImageFileName(null)
      setShowModel(false)
      setSelectedPod(null)
      return
    }

    let items = [...tileCordinates];
    let item = { ...items[selectedTile], ...formValue };
    items[selectedTile] = item;
    localStorage.setItem('coordinates', JSON.stringify(items))
    setTileCordinates(items)
    setFormValue({})
    setSelectedTile(null)
    setImageFileName(null)
    setShowModel(false)
  }

  const deleteTile = (index) => {
    if (selectedPod) {
      let podIndex = selectedPod.podIndex
      let tileIndex = selectedPod.tileIndex
      let items = [...pods]
      let pod = items[podIndex]
      let tiles = pod.tiles
      tiles.splice(tileIndex, 1)
      items[podIndex].tiles = tiles
      localStorage.setItem('pods', JSON.stringify(items))
      setShowModel(false)
      setSelectedPod(null)
      setPods(items)
      return
    }
    tileCordinates.splice(index, 1)
    setTileCordinates([...tileCordinates])
    setShowModel(false)
    localStorage.setItem('coordinates', JSON.stringify(tileCordinates))

  }

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImageFileName(selectedImage.name)
    const values = formValue
    values.tileImage = URL.createObjectURL(selectedImage)
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
      position: 'relative'
    }
    return stylevalue
  }
  const createPods = (dragTile, dropTile) => {

    let tiles = tileCordinates
    let removableTileIds = [dragTile.id, dropTile.id]
    const filteredArray = tiles.filter(obj => !removableTileIds.includes(obj.id));
    localStorage.setItem('coordinates', JSON.stringify(filteredArray))
    setTileCordinates(filteredArray)

    const newPod = {
      id: Date.now(),
      isPod: true,
      x: dropTile.x,
      y: dropTile.y,
      height: 185,
      width: 325,
      tiles: [dropTile, dragTile],
    };
    setPods([...pods, newPod]);
  }

  const updatePods = (dragtile, droppablePod) => {

    let dragTileIndex = tileCordinates.findIndex(obj => obj.id === dragtile.id)
    deleteTile(dragTileIndex)

    let tempPods = pods
    let objIndex = tempPods.findIndex(obj => obj.id === droppablePod.id)
    if (objIndex !== -1) {
      tempPods[objIndex].tiles.push(dragtile);
    }
    localStorage.setItem('pods', JSON.stringify(tempPods));
    setPods(tempPods)
  }

  const handleDragStop = (e, data, tile, index) => {

    const tileBounds = document
      .getElementById(tile.id)
      .getBoundingClientRect();

    const overlappingPod = pods.find((pod) => {
      const nearPodBound = document
        .getElementById(pod.id)
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


    const overlappingTile = tileCordinates.find((nearTile) => {
      const nearTileBound = document
        .getElementById(nearTile.id)
        .getBoundingClientRect();

      if (nearTile.id === tile.id) {
        return false;
      }

      return (
        tileBounds.left <= nearTileBound.right &&
        tileBounds.right >= nearTileBound.left &&
        tileBounds.top <= nearTileBound.bottom &&
        tileBounds.bottom >= nearTileBound.top
      );


    });

    if (overlappingTile) {
      createPods(tile, overlappingTile)
    } else {
      const { x, y } = data;
      e.preventDefault();
      let items = [...tileCordinates];
      let item = { ...items[index] };
      item.x = x;
      item.y = y;
      items[index] = item;
      localStorage.setItem('coordinates', JSON.stringify(items));
      setTileCordinates([...items]);

    }

  }



  const handleResizeStop = (e, direction, ref, delta, position, index) => {
    e.preventDefault();
    let items = [...tileCordinates];
    let item = { ...items[index] };
    item.width = ref.style.width;
    item.height = ref.style.height;
    items[index] = item;
    localStorage.setItem('coordinates', JSON.stringify(items));
    setTileCordinates([...items]);
  }
  const handlePodDragStop = (e, data, pod, index) => {
    const { x, y } = data;
    e.preventDefault();
    let items = [...pods];
    let item = { ...items[index] };
    item.x = x;
    item.y = y;
    items[index] = item;
    localStorage.setItem('pods', JSON.stringify(items));
    setPods([...items]);

  }

  const handlePodResizeStop = (e, direction, ref, delta, position, index) => {
    let items = [...pods];
    let item = { ...items[index] };
    item.width = ref.style.width;
    item.height = ref.style.height;
    items[index] = item;
    localStorage.setItem('pods', JSON.stringify(items));
    setPods([...items])
  }


  const addBoard = () => {
    let dashBoards = [...boards]
    dashBoards.push({
      dashNumber: `Dash${boards.length + 1}`,
      id: Date.now()
    })
    localStorage.setItem('boards', JSON.stringify(dashBoards));
    setBoards(dashBoards)
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
      items[podIndex].tiles[tileIndex].tileContent = content
      localStorage.setItem('pods', JSON.stringify(items))
      setSelectedPod(null)
      setOpenTextEdior(false)
      setTextEditorContent(null)
      return
    }
    let items = [...tileCordinates];
    let item = { ...items[selectedTile] };
    items[selectedTile].tileContent = content;
    localStorage.setItem('coordinates', JSON.stringify(items))
    setTileCordinates(items)
    setSelectedTile(null)
    setTextEditorContent(null)
    setOpenTextEdior(false)
  }

  const onSortEnd = (tileList , pod ,podIndex) => {
    pod['tiles'] = tileList
    let podsArray = [ ...pods ]
    podsArray[podIndex] = pod 
    localStorage.setItem('pods', JSON.stringify(podsArray))
    setPods(podsArray)
  };

  const deletePod = (index) => {
    let podsArray = [ ...pods ]
    podsArray.splice(index , 1)
    localStorage.setItem('pods', JSON.stringify(podsArray))
    setPods(podsArray)
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
        localStorage.setItem('coordinates', JSON.stringify(freeTiles))
      }
      else{  
      pod.tiles.splice(newIndex, 1)
      onSortEnd(pod.tiles, pod, podIndex)
      let freeTiles = [...tileCordinates]
      freeTiles = [...tileCordinates, tile]
      setTileCordinates(freeTiles)
      localStorage.setItem('coordinates', JSON.stringify(freeTiles))
      }
    }
  }

  


  return (
    <div className="main_grid_container">
      <div className='board_nav'>
        {boards.map((board, index) => {
          return (
            <List>
              <ListItem button>
                <ListItemText primary={board.dashNumber} />
              </ListItem>
            </List>
          )
        })}
        <Button sx={{ p: '11px' }} onClick={() => addBoard()}>+ New</Button>
      </div>
      <div className="add_tiles" onClick={addTiles}>
        <AddSharpIcon />
      </div>

      <div className="tiles_container">
        {pods.map((pod, index) => (
          <div className='pods' key={pod.id} >
            <Rnd
              style={podStyle(index)}
              size={{ width: pod.width, height: pod.height }}
              position={{ x: pod.x, y: pod.y }}
              disableDragging={disableDrag}
              onDragStop={(e, d) => handlePodDragStop(e, d, pod, index)}
              onResizeStop={(e, direction, ref, delta, position) => handlePodResizeStop(e, direction, ref, delta, position, index)}
              id={pod.id}
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
                    <div className='innerTile' key={tile.id} style={innerTileStyle(tile)}
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
              // default={{
              //   x: (index)*160,  
              //   y: 0,
              //   width: 150,
              //   height: 150
              // }}
              id={tile.id}
            >
              {tileCordinates[index].tileImage ? '' : changedTitlehandle(index)}
              {tileCordinates[index].tileImage && <img src={tileCordinates[index].tileImage} alt="Preview" style={{ width: tile.width, height: tile.height, borderRadius: '10px' }} />}
              {showOption === `tiles_${index}` && <div className="showOptions absolute top-0 right-2 cursor-pointer " onClick={(e) => openModel(e, index, null)}>
                <MoreHorizSharpIcon />
              </div>}
            </Rnd>
          </div>
        )
        )}
      </div>
      {showModel ? <div className='tiles_popup' open={showModel} id={`model_${selectedTile}`}>
        <div>
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
                defaultValue="text"
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
              {/*<li>
                <span onClick={ handleClick }><ColorizeSharpIcon/></span>
                 { displayColorPicker ? 
                  <div style={ popover }>
                    <div style={ cover } onClick={ handleClose } onChange={ handleChange } />
                    <ChromePicker />
                  </div> : null }
                <span>Box Color</span>
              </li>*/}

              {colorImage === 'color' &&
                <li>
                  <ColorPicker handleColorChange={handleColorChange} />
                </li>}
              {textLink === 'text' &&
                <li>
                  <span><TitleSharpIcon /></span>
                  <span>Box Text</span>
                  <input type="text"
                    value={formValue.tileText}
                    defaultValue=''
                    onChange={enterText} />
                </li>}
              {textLink === 'link' &&
                <li>
                  <span><AddLinkSharpIcon /></span>
                  <span>Box Link</span>
                  <input type="text"
                    value={formValue.tileLink}
                    defaultValue=''
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

        </div>
      </div> : ""}
      <TextEditor open={openTextEditor}
        onClose={handleCloseTextEditor}
        content={textEditorContent}
        onSave={updateEditorContent}
      />
    </div>
  );
}