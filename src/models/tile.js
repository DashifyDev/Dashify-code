import { Schema, model, models } from 'mongoose';

const tileSchema = new Schema({
    tileColor: {
        type : String
    },

    tileLink: {
        type : String
    },

    tileText: {
        type : String
    },

    tileContent: {
        type : String,
    },

    tileImage: {
        type : String
    },

    width: {
        type : String,
        required : true
    },
   
    height: {
        type : String,
        required: true,
    },

    x:{
        type : Number,
        required: true,
    },

    y:{
        type : Number,
        required: true,
    },

    isInsidePod: { 
        type: Boolean, 
        'default': false 
    },
    
    showTitleWithImage: { 
        type: Boolean, 
    }

});

const Tile = models.Tile || model('Tile', tileSchema);

export default Tile;