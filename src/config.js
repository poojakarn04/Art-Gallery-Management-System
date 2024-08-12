const mongoose = require('mongoose');

// Connect to MongoDB
const connect = mongoose.connect('mongodb://localhost:27017/dbms-login');

// Check database connection
connect.then(() => {
  console.log('Database is successfully connected');
}).catch(() => {
  console.log('Database cannot be connected');
});

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
const FinalCollection = mongoose.model('grandtotal',FinalSchema)
module.exports = {
  UserCollection,
  ImageCollection,
  FinalCollection
};