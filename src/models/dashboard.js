import { Schema, model, models,mongoose } from 'mongoose';

const dashboardSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    tiles: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Tile'
        }
    ],
    pods : [
        {
            type: Schema.Types.ObjectId,
            ref: 'Pod'
        }
    ],
    userId : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    default: {
        type:Boolean
    }
});


const Dashboard = models.Dashboard || model('Dashboard', dashboardSchema);

export default Dashboard;