const mongoose = require('mongoose');
const {Schema} = mongoose;

const repliesSchema = new Schema({
    _id: Schema.Types.ObjectId,
    text: String,
    created_on: Date,
    delete_password: String,
    reported: Boolean,
});

const threadSchema = new Schema({
  board: String,
  text: String,
  created_on: {type: Date, default: Date.now},
  bumped_on: {type: Date, default: Date.now},
  reported: {type: Boolean, default: false},
  delete_password: String,
  replies: [repliesSchema]
});

const Thread = mongoose.model("Thread", threadSchema);

module.exports = Thread;