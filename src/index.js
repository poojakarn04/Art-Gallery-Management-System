const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { UserCollection, ImageCollection, FinalCollection } = require('./config');
const multer = require('multer');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();
const app = express();

const mongoURI = process.env.MONGODB_URI;
const conn = mongoose.createConnection(mongoURI);

let gfs;
let gridFSBucket;
conn.once('open', () => {
  gridFSBucket = new GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get('/test', (req, res) => {
  res.send('Server is working');
});

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
    email: req.body.email,
    gender: req.body.gender,
    role: req.body.role
  };

  const existingUser = await UserCollection.findOne({ name: data.name });
  if (existingUser) {
    res.send("User already exists, Please choose a different username");
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const userdata = await UserCollection.insertMany(data);
    console.log(userdata);
    res.redirect('/');
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await UserCollection.findOne({ name: username });

    if (!user) {
      return res.send("User not found. Please check your username.");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      req.session.username = username;

      if (user.role === 'artist') {
        res.render("home_artist");
      } else if (user.role === 'customer') {
        res.render("sample");
      } else {
        res.send("Invalid user role.");
      }
    } else {
      res.send("Incorrect password. Please try again.");
    }
  } catch (err) {
    console.error("An error occurred:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/upload", upload.single('image'), async (req, res) => {
  const { name, desc, price} = req.body;
  const username = req.session.username;

  if (!username) {
    return res.status(400).send("User is not logged in");
  }

  console.log('Upload request received: ', { name, desc, price, username, file: req.file });

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const fileName = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);

  const image = {
    filename: fileName,
    contentType: req.file.mimetype,
    imageBase64: req.file.buffer.toString('base64'),
    description: desc,
    price: price,
    username: username
  };

  try {
    const savedImage = await ImageCollection.create(image);
    console.log("Image saved successfully:", savedImage);
    //res.redirect('/next');
  } catch (err) {
    console.error("Error saving image:", err);
    res.status(500).send("Error uploading image");
  }
});

function isAuthenticated(req, res, next) {
  if (req.session.username) {
    return next();
  } else {
    res.redirect('/');
  }
}

app.post('/submit-booking', async (req, res) => {
  const { username, totalPrice } = req.body;
  console.log('Received data:', { username, totalPrice }); // Log the received data

  try {
    const newEntry = new FinalCollection({ username, totalPrice });
    await newEntry.save();
    console.log('Data saved successfully:', newEntry); // Log successful save
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving to database:', err);
    res.json({ success: false });
  }
});


app.get('/next', isAuthenticated, async (req, res) => {
  const username = req.session.username;

  try {
    const images = await ImageCollection.find({ username });
    res.render('next', { images });
  } catch (err) {
    console.error('Failed to fetch images:', err);
    res.status(500).send('An error occurred while fetching images');
  }
});

app.get('/home_customer', async (req, res) => {
  const username = req.session.username;
  try {
    const images = await ImageCollection.find({});
    res.render('home_customer', { images, username }); // Pass username to the template
  } catch (err) {
    console.error('Failed to fetch images:', err);
    res.status(500).send('An error occurred while fetching images');
  }
});

app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readstream = gridFSBucket.openDownloadStreamByName(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
