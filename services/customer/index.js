const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://mongo:27017/microservices', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});
const User = mongoose.model('User', userSchema);

const JWT_SECRET = 'test-secret'; // Must match Kong's secret
const JWT_ISSUER = 'test-key';    // Must match Kong's key


// log any request to the customer service
app.get('/', (req, res) => {
  res.send('Customer Service /get');
});

app.post('/', (req, res) => {
  res.send('Customer Service /post');
});

// Register endpoint (public)
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Username already exists' });
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login endpoint (public)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    // Issue JWT
    const token = jwt.sign({ sub: user._id, username, iss: JWT_ISSUER }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.listen(3000, () => console.log('Customer Service running')); 