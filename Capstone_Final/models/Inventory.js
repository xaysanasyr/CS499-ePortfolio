const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    // How many dog slots are currently free.
    // Defaults to 30 for demos; change via seed/config in real deployments.
    dogSpaces: { type: Number, default: 30, min: 0 },

    // How many cat slots are currently free.
    catSpaces: { type: Number, default: 30, min: 0 }
  },
  {
    // Keep the collection name explicit so helpers/services can reference it safely.
    collection: 'inventories'
  }
);


module.exports = mongoose.model('InventoryModel', InventorySchema);
