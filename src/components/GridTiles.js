"use client";
'use strict'
import AddSharpIcon from '@mui/icons-material/AddSharp';
import React, { useState , useEffect} from 'react';
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


export default function GridTiles() {
  const [tilesCount, setTilesCount] = useState([""]);
  const [showOption , setShowOption] = useState(null);
  const [displayColorPicker , setDisplayColorPicker] = useState(null);
  const [showModel , setShowModel] = useState(false);
  const [selectedTile , setSelectedTile] = useState();
  const [tileText , setTileText] = useState('');
  const [tileLink , setTileLink] = useState('');
  const [colorpicked , setColorpicked] = useState('');
  const [savedItem ,setSavedItem] = useState('');
  const [changedTitle , setChangedTitle] = useState('Tiles');
  const [tileCordinates , setTileCordinates] = useState([
    {   
      width: 200,
      height: 200,
      x: 10,
      y: 10
    },
    {   
      width: 200,
      height: 200,
      x: 300,
      y: 10
    },
  ])
 
 
  useEffect(() => {
    if(localStorage.getItem('coordinates')){
      setTileCordinates(JSON.parse(localStorage.getItem('coordinates')));
    }
  },[]);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker )
  };

  const handleClose = () => {
    setDisplayColorPicker(false )
  };

  const addTiles = () => {
    setTileCordinates([...tileCordinates,  {   
      width: 200,
      height: 200,
      x: 10,
      y: 10
    }])
  }

  const handleColorChange = (color) => {
    setColorpicked(color.hex)
  }

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

  const openModel = (e,index) => {
    e.stopPropagation();
    setShowModel(true);
    setSelectedTile(index)
  }

  const enterText = (e) => {
    setTileText(e.target.value)
  }
  const enterLink = (e) => {
    setTileLink(e.target.value)
  }

  const handleSave = (index) => {
    setSavedItem(index);
    setShowModel(false)
  }

  const style = (index) => {
    const stylevalue = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "solid 1px #ddd",
      // background: 'pink',
      background: savedItem !== `tiles_${index}` ? "pink" : colorpicked,
      color: 'black',
      borderRadius: '10px' ,
      margin: '10px 20px'
    }
    return stylevalue
     
  }

  const changedTitlehandle = (index) => {
    const titleVal = (savedItem !== `tiles_${index}` ? "Tiles" : tileText)
    return titleVal
  }

  const setLinkRedirection = (e ,index) => {
    if(savedItem === `tiles_${index}`){
       window.open(tileLink, '_blank');
    }
  }


  const handleDragStop = (e , d , index) => {
    e.preventDefault();
    let items = [...tileCordinates];
    let item = {...items[index]};
    item.x = d.x;
    item.y = d.y;
    items[index] = item;
    setTileCordinates([...items]);
    localStorage.setItem('coordinates', JSON.stringify(tileCordinates));
  }

  const handleResizeStop = (e, direction, ref, delta, position , index) => {
    e.preventDefault();
    let items = [...tileCordinates];
    let item = {...items[index]};
    item.width = ref.style.width;
    item.height = ref.style.height;
    items[index] = item;
    setTileCordinates([...items]);
    localStorage.setItem('coordinates', JSON.stringify(tileCordinates));
  }


  return (
   <div className="main_grid_container">
      <div className="add_tiles" onClick={addTiles}>
        <AddSharpIcon />
      </div>
      <div className="tiles_container" >
        {tileCordinates.map((tile, index)=>{
            return (
              <div className='relative' key={index} >
                <Rnd
                  onMouseEnter={() => setShowOption(`tiles_${index}`)} 
                  onMouseLeave = {() => setShowOption(null)}
                  style={style(index)}
                  size={{ width: tile.width, height: tile.height }}
                  position={{ x: tile.x, y: tile.y }}
                  onDragStop={(e, d ) => handleDragStop(e,d,index)}
                  onResizeStop={(e, direction, ref, delta, position ) => handleResizeStop(e, direction, ref, delta, position , index)}
                  onClick={(e) => setLinkRedirection(e ,index)}
                  id={`tiles_${index}`}
                > 
                  {changedTitlehandle(index)}
                  {showOption === `tiles_${index}` && <div className="showOptions absolute top-0 right-2 cursor-pointer " onClick={(e) => openModel(e,index)}>
                    <MoreHorizSharpIcon />
                  </div> }
                  
                </Rnd>
            </div> )
        })}
      </div>
   </div>
  );
}