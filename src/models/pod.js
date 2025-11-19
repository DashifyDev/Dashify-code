import { Schema, model, models } from "mongoose";

const podSchema = new Schema({
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

  tiles: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tile",
    },
  ],

  isPod: {
    type: Boolean,
    default: true,
  },
});

const Pod = models.Pod || model("Pod", podSchema);

export default Pod;
