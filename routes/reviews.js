var express = require('express');
var router = express.Router();
var passport = require('passport');

// Import models
var Review = require('../Reviews');
var Movie = require('../Movies');

/**
 * GET all reviews */
router.get('/', async (req, res) => {
  try {
    let filter = {};

    // GET all reviews by movieId
    if (req.query.movieId) {
      filter.movieId = req.query.movieId;
    }

    const reviews = await Review.find(filter).populate('movieId');
    res.json(reviews);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST create a review (JWT protected)
 */
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { movieId, username, review, rating } = req.body;

      const newReview = new Review({
        movieId,
        username,
        review,
        rating
      });

      await newReview.save();

      res.json({ message: 'Review created!' });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/**
 * DELETE a review
 */
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      await Review.findByIdAndDelete(req.params.id);
      res.json({ message: 'Review deleted!' });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

module.exports = router;
