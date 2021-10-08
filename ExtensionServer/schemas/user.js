const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
}, {
  versionKey: false,
});

const UserSchema = model('user', userSchema);

module.exports = UserSchema;
