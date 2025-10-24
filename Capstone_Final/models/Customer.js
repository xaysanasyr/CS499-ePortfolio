const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    // ---- identity ----
    // Name is the only hard requirement. We trim to avoid " John  " issues.
    name: {
      type: String,
      required: [true, 'customer name required'],
      trim: true,
    },

    // ---- contact (optional) ----
    // Phone: optional for quick check-ins; we can enforce patterns in routes/services later.
    phone: {
      type: String,
      trim: true,
    },

    // Email: optional. Store lowercase so lookups are consistent 
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    // createdAt / updatedAt help with audit trails and "recent customers" lists.
    timestamps: true,
  }
);

// ---- indexes ----
// Name: general find-by-name searches and typeahead.
CustomerSchema.index({ name: 1 });

// Phone/email: mark sparse so MongoDB only indexes docs that have the field present.
// This keeps the index small and avoids indexing "undefined" across all docs.
CustomerSchema.index({ phone: 1 }, { sparse: true });
CustomerSchema.index({ email: 1 }, { sparse: true });

// ---- instance helpers ----
// Return a minimal "receipt-safe" view. We avoid returning the entire doc to the UI,
// which keeps responses small and reduces accidental data leakage.
CustomerSchema.methods.toReceipt = function () {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone || null,
    email: this.email || null,
  };
};

module.exports = mongoose.model('Customer', CustomerSchema);
