const BookingModel = require('../models/BookingModel');

async function revenueByDay() {
  return BookingModel.aggregate([
    // If you want only realized revenue, uncomment next line:
    // { $match: { status: 'CLOSED' } },

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

/*
Alternative: realized revenue by checkout date
------------------------------------------------
return BookingModel.aggregate([
  { $match: { status: 'CLOSED', checkOutAt: { $ne: null } } },
  {
    $group: {
      _id: { $dateToString: { date: '$checkOutAt', format: '%Y-%m-%d' } },
      total: { $sum: '$amountDue' }
    }
  },
  { $sort: { _id: 1 } }
]);

Notes:
- If you store taxes/discounts later, include them in the $sum expression.
- If you need currency-safe math, keep numbers in cents (integers) to avoid float drift.
*/
