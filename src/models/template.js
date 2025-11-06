import { Schema, model, models, mongoose } from "mongoose";

const templateSchema = new Schema({
  boardName: {
    type: String,
    required: true,
  },
  keywords: [
    {
      type: String,
    },
  ],

  boardImage: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: String,
  },
  rating: {
    type: String,
  },
  boardLink: {
    type: String,
  },
  boardDescription: {
    type: String,
  },
});

const Template = models.Template || model("Template", templateSchema);

export default Template;
