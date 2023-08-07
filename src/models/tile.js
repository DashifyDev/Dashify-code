import { Schema, model, models } from 'mongoose';

const tileSchema = new Schema({

    tileLink: {
        type : String
    },

    tileText: {
        type : String
    },

    tileContent: {
        type : String,
    },

    tileBackground: {
        type : String
    },

    action : {
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
    
    displayTitle: {
        type: Boolean, 
    },
    titleX:{
        type:Number
    },
    titleY:{
        type : Number
    },

});

const Tile = models.Tile || model('Tile', tileSchema);

export default Tile;