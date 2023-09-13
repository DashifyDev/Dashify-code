import { Schema, model, models,mongoose } from 'mongoose';

const templateSchema = new Schema({
    boardName: {
        type: String,
        required: true
    },
    keywords: [
        {
            type: String
        }
    ],

    boardImage : {
        type : String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    date:{
        type: Date
    },
    rating:{
        type: String
    },
    boardLink:{
        type:String,
    }
});

const Template = models.Template || model('Template', templateSchema);

export default Template;