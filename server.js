require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const User = require('./Users');
const Movie = require('./Movies');
const authJwtController = require('./auth_jwt');

const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

// Connect to MongoDB
mongoose.connect(process.env.DB)
  .then(() => console.log('server.js PHAM-HW4 Connected to MongoDB'))
  .catch(err => {
    console.error('server.js PHAM-HW4 MongoDB Connection Error:', err);
    process.exit(1);
  });

// Home route
app.get('/', (req, res) => {
    res.send('PHAM_Assignment4_MoviesAPI is Live!');
});

// Routes
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  if (!req.body.username || !req.body.password)
    return res.status(400).json({ success: false, msg: 'Username and password required.' });

  try {
    const user = new User({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password
    });

    await user.save();
    res.status(201).json({ success: true, msg: 'User created successfully.' });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ success: false, msg: 'Username already exists.' });
    else
      return res.status(500).json({ success: false, msg: err.message });
  }
});

// Signin
router.post('/signin', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');
    if (!user) return res.status(401).json({ success: false, msg: 'User not found.' });

    const isMatch = await user.comparePassword(req.body.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Incorrect password.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// Movies CRUD
router.route('/movies')
  .post(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = new Movie(req.body);
      const savedMovie = await movie.save();
      res.status(201).json(savedMovie);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  })
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movies = await Movie.find();
      res.status(200).json(movies);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

// Single movie operations
// Single movie operations by title
router.route('/movies/:title')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findOne({ title: req.params.title });
      if (!movie) return res.status(404).json({ success: false, msg: 'Movie not found' });
      res.status(200).json(movie);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const updatedMovie = await Movie.findOneAndUpdate(
        { title: req.params.title },
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedMovie) return res.status(404).json({ success: false, msg: 'Movie not found' });
      res.status(200).json(updatedMovie);
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const deletedMovie = await Movie.findOneAndDelete({ title: req.params.title });
      if (!deletedMovie) return res.status(404).json({ success: false, msg: 'Movie not found' });
      res.status(200).json({ success: true, msg: 'Movie deleted' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

// Reivews router
var reviewsRouter = require('./routes/reviews');
app.use('/api/reviews', reviewsRouter);

// Use router
app.use('/', router);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});