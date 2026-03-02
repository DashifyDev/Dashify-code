import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  auth0Id: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isSocialLogin: {
    type: Boolean,
    default: true,
  },
  lastGuestMigrationKey: {
    type: String,
  },
  lastGuestMigrationAt: {
    type: Date,
  },
  stripeCustomerId: {
    type: String,
  },
  stripeSubscriptionId: {
    type: String,
  },
  subscriptionStatus: {
    type: String,
  },
  subscriptionCurrentPeriodEnd: {
    type: Date,
  },
  plan: {
    type: String,
  },
});

const User = models.User || model("User", userSchema);

export default User;
