const { Schema, model } = require('mongoose');

const sessionSchema = new Schema({
  url: {
    type: String,
    index: true,
    required: true,
  },
  host: {
    type: String,
    required: true,
  },
  session_id: {
    type: String,
    required: true,
  },
  watchers: {
    type: Array,
    default: [],
  },
}, {
  versionKey: false,
  timestamps: true,
});

const Session = model('session', sessionSchema);

module.exports = Session;
