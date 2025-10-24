const mongoose = require('mongoose');

// Small embedded subdocument for grooming add-ons.
// _id is disabled so we don’t generate a separate ObjectId for this tiny object.
const GroomingSchema = new mongoose.Schema({
  // e.g., "bath", "full". We keep it loose (trimmed string) so pricing logic can map as needed.
  type: { type: String, trim: true },
  // Final grooming price for this booking (snapshotted); not re-derived later.
  price: { type: Number, min: 0 }
}, { _id: false });

// Main booking schema: one row per check-in/check-out
const BookingSchema = new mongoose.Schema(
  {
    // We store minimal pet info directly for fast receipt printing and list screens,
    // plus the ObjectId ref if we need to populate more details.
    pet: {
      // Foreign key link to Pet collection
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
      // Normalize to 'dog'|'cat' for capacity rules; enum guards invalid types
      type: { type: String, required: true, enum: ['dog', 'cat'] },
      // Snapshot of the pet’s name at the time of booking; lets us show history even if the
      // Pet doc changes later
      name: { type: String, required: true, trim: true },
    },

    // Same pattern for the customer: snapshot name for convenience, keep ref for depth.
    customer: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
      name: { type: String, required: true, trim: true },
    },

    // Required nights of stay. Min=1 protects against accidental zero/negative entries.
    daysStay: { type: Number, required: true, min: 1 },

    // Optional grooming add-on captured at booking time; can be null/undefined.
    grooming: { type: GroomingSchema }, // optional

    // Total amount due for the stay (and grooming if any). We store the computed value
    // to keep receipts stable over time and avoid re-computing against changing prices.
    amountDue: { type: Number, required: true, min: 0 },

    // ---- lifecycle fields ----
    // OPEN: active stay (checked in, not checked out yet)
    // CLOSED: completed stay (checked out and paid)
    // CANCELED: booking voided (capacity may have been released)
    status: { type: String, enum: ['OPEN', 'CLOSED', 'CANCELED'], default: 'OPEN', index: true },

    // When the pet actually checked out. We keep this separate from updatedAt so we can
    // report on checkout times precisely.
    checkOutAt: { type: Date }
  },
  {
    // createdAt = booking creation (usually check-in time)
    // updatedAt = last mutation (e.g., grooming added, status change)
    timestamps: true
  }
);

// ---- indexes ----
// Query: recent bookings for a specific customer (history/receipts view)
BookingSchema.index({ 'customer.id': 1, createdAt: -1 });

// Query: recent bookings for a specific pet (pet history)
BookingSchema.index({ 'pet.id': 1, createdAt: -1 });

// Dashboard/report screens that show “latest bookings first”
BookingSchema.index({ createdAt: -1 });

// Model name: 'BookingModel' to match existing imports.
// If you prefer shorter names, you can rename across the codebase later.
module.exports = mongoose.model('BookingModel', BookingSchema);
