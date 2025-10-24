const mongoose = require('mongoose');

// tiny helpers so my checks read easy
function isWholeNumber(n) {
  // age can be 0 for a kitten/puppy; integers only
  return Number.isInteger(n) && n >= 0;
}

const PetSchema = new mongoose.Schema(
  {
    // ---- species/type ----
    // We only allow 'dog' or 'cat'.
    // lowercase+trim keeps data consistent regardless of user input style.
    type: {
      type: String,
      required: [true, 'type required'],
      enum: ['dog', 'cat'],
      trim: true,
      lowercase: true,
    },

    // ---- identity ----
    // Pet needs a non-empty name for receipts, search, and history.
    name: {
      type: String,
      required: [true, 'name required'],
      trim: true,
    },

    // ---- attributes ----
    // Age stored as whole number years for simplicity.
    age: {
      type: Number,
      required: [true, 'age required'],
      validate: {
        validator: isWholeNumber,
        message: 'age must be an integer >= 0',
      },
    },

    // ---- ownership ----
    // Link to owner (Customer) is optional at creation time.
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
  },
  {
    // createdAt / updatedAt useful for timelines and “recent pets” lists
    timestamps: true,
  }
);

// ---- indexes ----
// name: quick find by pet name (also useful for typeahead)
// ownerId: list all pets for a given customer efficiently
PetSchema.index({ name: 1 });
PetSchema.index({ ownerId: 1 });

// ---- instance helpers ----
// Minimal view safe for receipts/confirmations.
// Keeps responses small and avoids exposing internal fields by accident.
PetSchema.methods.toReceipt = function () {
  return {
    id: this._id,
    type: this.type,
    name: this.name,
    age: this.age,
  };
};

module.exports = mongoose.model('Pet', PetSchema);
