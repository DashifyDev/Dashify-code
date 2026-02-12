"use strict";

import React, { useState, useEffect } from "react";
import { ChromePicker } from "react-color";

const ColorPicker = ({ handleColorChange, colorBackground }) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [color, setColor] = useState({
    r: 222,
    g: 237,
    b: 240,
    a: 1,
  });
  const [selectedHex, setSelectedHex] = useState(colorBackground || "#deedf0");

  useEffect(() => {
    if (colorBackground) {
      // Check if it's rgba format
      if (colorBackground.startsWith('rgba')) {
        const rgbaMatch = colorBackground.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1]);
          const g = parseInt(rgbaMatch[2]);
          const b = parseInt(rgbaMatch[3]);
          const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
          setColor({ r, g, b, a });
          setSelectedHex(colorBackground);
        }
      } else {
        // It's hex format
        setSelectedHex(colorBackground);
        const hex = colorBackground.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        setColor({ r, g, b, a: 1 });
      }
    }
  }, [colorBackground]);

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (newColor) => {
    setColor(newColor.rgb);
    // Use rgba if alpha is less than 1, otherwise use hex
    if (newColor.rgb.a !== undefined && newColor.rgb.a < 1) {
      const rgbaString = `rgba(${newColor.rgb.r}, ${newColor.rgb.g}, ${newColor.rgb.b}, ${newColor.rgb.a})`;
      setSelectedHex(rgbaString);
    } else {
      setSelectedHex(newColor.hex);
    }
    handleColorChange(newColor);
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#63899e] hover:shadow-md transition-all duration-200 shadow-sm"
        onClick={handleClick}
      >
        <div className="relative">
          <div
            className="w-16 h-16 sm:w-12 sm:h-12  rounded-lg border-2 border-gray-300 shadow-inner"
            style={{
              backgroundColor: color.a !== undefined && color.a < 1 
                ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
                : selectedHex,
            }}
          />
          <div
            className="absolute inset-0 rounded-lg border-2 border-white/50 pointer-events-none"
            style={{
              boxShadow: "0 0 0 1px rgba(0,0,0,0.1) inset",
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium">Selected Color</span>
          <span className="text-sm font-semibold text-gray-800">
            {color.a !== undefined && color.a < 1
              ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a.toFixed(2)})`
              : selectedHex.toUpperCase()}
          </span>
        </div>
      </div>
      {displayColorPicker && (
        <div className="absolute z-50 mt-2 left-0">
          <div
            className="fixed inset-0"
            onClick={handleClose}
          />
          <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 p-3">
            <ChromePicker
              color={color}
              onChange={handleChange}
              disableAlpha={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
