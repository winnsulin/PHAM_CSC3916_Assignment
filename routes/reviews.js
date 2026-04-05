/*Step 2: Route for adding API Reviews.js*/

var express = require('express');
var router = express.Router();
var passport = require('passport');

// require the Review model
var Review = require('../models/reviews');

/**
 * GET all reviews (optionally by movieId)
 * Example: /api/reviews?movieId=123
 */
router.get('/', async (req, res) => {
  try {
    let filter = {};

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

      res.json({ message: 'K thx.' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

/**
 * OPTIONAL: DELETE a review
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