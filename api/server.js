const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://manasakondoju181:BWX8lfBlCCgmuL7t@cluster0.6yliz.mongodb.net/<yourDatabaseName>?retryWrites=true&w=majority&ssl=true')
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch(err => {
    console.log("MongoDB connection error:", err);
  });


app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try{
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if the user exists in the database
    const userDoc = await User.findOne({ username });
    if (!userDoc) {
      return res.status(400).json('User not found');
    }

    // Compare the password with the hashed password in the database
    const passOk = await bcrypt.compare(password, userDoc.password); // Using async compare
    if (!passOk) {
      return res.status(400).json('Wrong credentials');
    }

    // Generate the JWT token and send the response
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) {
        return res.status(500).json('Internal server error');
      }
      res.cookie('token', token, { httpOnly: true }).json({
        id: userDoc._id,
        username,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json('Internal server error');
  }
});


app.get('/profile', (req,res) => {
  const {token} = req.cookies;

  if (!token) {
    return res.status(401).json({ message: 'Token not provided. Please log in.' });
  }
  
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  const {originalname,path} = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path+'.'+ext;
  fs.renameSync(path, newPath);

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {title,summary,content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:newPath,
      author:info.id,
    });
    res.json(postDoc);
  });

});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;

    try {
      const postDoc = await Post.findById(id);

      if (!postDoc) {
        return res.status(404).json({ message: 'Post not found' });
      }

      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(403).json({ message: 'You are not the author' });
      }

      // Update the document fields
      postDoc.title = title;
      postDoc.summary = summary;
      postDoc.content = content;
      if (newPath) {
        postDoc.cover = newPath;
      }

      // Save the updated document
      await postDoc.save();

      res.json(postDoc);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while updating the post' });
    }
  });
});


app.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})

app.listen(5000,()=>{
  console.log("server running");
});
