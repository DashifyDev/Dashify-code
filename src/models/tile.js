import { Schema, model, models } from "mongoose";

const tileSchema = new Schema({
  tileLink: {
    type: String,
  },

  tileText: {
    type: String,
  },

  tileContent: {
    type: String,
  },

  tileBackground: {
    type: String,
  },

  action: {
    type: String,
  },

  width: {
    type: String,
    required: true,
  },

  height: {
    type: String,
    required: true,
  },

  x: {
    type: Number,
    required: true,
  },

  y: {
    type: Number,
    required: true,
  },

  isInsidePod: {
    type: Boolean,
    default: false,
  },

  displayTitle: {
    type: Boolean,
  },
  titleX: {
    type: Number,
  },
  titleY: {
    type: Number,
  },
  editorHeading: {
    type: String,
  },
  backgroundAction: {
    type: String,
  },
  // Order field for box ordering (used in text editor navigation)
  order: {
    type: Number,
    default: 0,
  },
  // Mobile profile specific fields
  mobileX: {
    type: Number,
    default: 0,
  },
  mobileY: {
    type: Number,
    default: 0,
  },
  mobileWidth: {
    type: String,
  },
  mobileHeight: {
    type: String,
  },
});

const Tile = models.Tile || model("Tile", tileSchema);

export default Tile;
