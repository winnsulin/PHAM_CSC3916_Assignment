/*Step 2: Route for adding API Reviews.js*/
/*routes/reviews.js*/

var express = require('express');
var router = express.Router();
var passport = require('passport');

// require the Review model
var Review = require('../Reviews');
/**
 * GET all reviews for all movies
Movies (ALL + aggregation) */

router.get('/movies', authJwtController.isAuthenticated, async (req, res) => {
  try {
    if (req.query.reviews === 'true') {
      const moviesWithReviews = await Movie.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'movieId',
            as: 'reviews'
          }
        }
      ]);

      return res.json(moviesWithReviews);
    }

    const movies = await Movie.find();
    res.json(movies);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* GET Reviews for individual movies*/
// Single movie (by title)
router.route('/movies/:title')
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findOne({ title: req.params.title });
      if (!movie) return res.status(404).json({ msg: 'Movie not found' });
      res.json(movie);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const updatedMovie = await Movie.findOneAndUpdate(
        { title: req.params.title },
        req.body,
        { new: true }
      );
      res.json(updatedMovie);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    try {
      await Movie.findOneAndDelete({ title: req.params.title });
      res.json({ msg: 'Movie deleted' });
    } catch (err) {
      res.status(400).json({ error: err.message });
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

      res.json({ message: 'Reviews created!' });
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
