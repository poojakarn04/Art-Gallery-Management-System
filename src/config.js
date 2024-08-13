require('dotenv').config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));


// Create schema for user login
const LoginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
});

const ImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  imageBase64: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true
  }
});

const FinalSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  totalPrice: {
    type: String,
    required: true
  }
});

// Collection part
const UserCollection = mongoose.model('users', LoginSchema);
const ImageCollection = mongoose.model('uploads.files', ImageSchema);
const FinalCollection = mongoose.model('grandtotal', FinalSchema);

module.exports = {
  UserCollection,
  ImageCollection,
  FinalCollection
};
