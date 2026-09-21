require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema & Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// --- ROUTES ---

// 1. Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check kung umiiral na ang user
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.send('<h2>Username or Email already exists! <a href="/registration.html">Try again</a></h2>');
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to database
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.send('<h2>Registration successful! <a href="/index.html">Click here to Login</a></h2>');
  } catch (error) {
    res.status(500).send('Error registering user: ' + error.message);
  }
});

// 2. Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hanapin ang user sa DB
    const user = await User.findOne({ username });
    if (!user) {
      return res.send('<h2>User not found! <a href="/index.html">Try again</a></h2>');
    }

    // I-compare ang password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send('<h2>Incorrect password! <a href="/index.html">Try again</a></h2>');
    }

    res.send(`<h1>Welcome, ${user.username}! Login successful.</h1>`);
  } catch (error) {
    res.status(500).send('Error logging in: ' + error.message);
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});