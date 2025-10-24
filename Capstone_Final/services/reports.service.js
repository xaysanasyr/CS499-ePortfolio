const BookingModel = require('../models/BookingModel');

async function revenueByDay() {
  return BookingModel.aggregate([

    // Group by day (YYYY-MM-DD) derived from createdAt.
    // _id becomes the day string; total is the sum of amountDue for that day.
    {
      $group: {
        _id: {
          $dateToString: { date: '$createdAt', format: '%Y-%m-%d' }
        },
        total: { $sum: '$amountDue' }
      }
    },

    // Sort days ascending so console.table reads top→down chronologically.
    { $sort: { _id: 1 } }
  ]);
}

module.exports = { revenueByDay };
