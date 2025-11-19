import React, { useState } from "react";
import { colorPalette } from "@/constants/colorPalette";
import "./ColorGridPicker.css";

const ColorGridPicker = ({ onColorSelect, currentColor }) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const handleColorClick = (color) => {
    setSelectedColor(color);
    onColorSelect(color);
  };

  return (
    <div className="color-grid-picker">
      <div className="base-colors">
        {colorPalette.baseColors.map((color, index) => (
          <button
            key={index}
            className={`base-color ${selectedColor === color ? "selected" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorClick(color)}
            title={color}
          />
        ))}
      </div>

      <div className="color-grid">
        {colorPalette.colorGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="color-row">
            {row.map((color, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`color-cell ${selectedColor === color ? "selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
                title={color}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorGridPicker;
