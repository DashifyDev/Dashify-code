import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
  firstName : {
    type : String,
  },
  lastName : {
    type : String,
  },
  email: {
    type: String,
    required: true,
  },
  picture : {
    type: String,
    required: true,
  },
  createdAt : {
    type : Date
  },
  isSocialLogin : {
    type : Boolean
  }
});

const User = models.User || model('User', userSchema);

export default User;