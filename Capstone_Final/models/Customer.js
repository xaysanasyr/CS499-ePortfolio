const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    // ---- identity ----
    // Name is the only hard requirement.
    name: {
      type: String,
      required: [true, 'customer name required'],
      trim: true,
    },

    // ---- contact  ----
    // Phone:
    phone: {
      type: String,
      trim: true,
    },

    // Email: Store lowercase so lookups are consistent 
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
// Name: 
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
