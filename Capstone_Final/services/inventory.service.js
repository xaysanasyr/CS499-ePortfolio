const Inventory = require('../models/Inventory');

// Ensure we have exactly one inventory row before the app starts taking bookings.
async function ensureInventory() {
  const existing = await Inventory.findOne();
  if (!existing) await Inventory.create({ dogSpaces: 30, catSpaces: 30 });
}


// We normalize input to lowercase and default to catSpaces if not 'dog'.
function keyFor(type) {
  const t = String(type || '').toLowerCase().trim();
  return t === 'dog' ? 'dogSpaces' : 'catSpaces';
}

// Reserve ONE space for a pet type.
// - Atomic: uses findOneAndUpdate with $gt and $inc to avoid overbooking.

async function reserve(petType) {
  const key = keyFor(petType);

  // Match only if capacity > 0, then decrement by 1 and return the new doc.
  const updated = await Inventory.findOneAndUpdate(
    { [key]: { $gt: 0 } },        // guard: must have space
    { $inc: { [key]: -1 } },      // atomic decrement
    { new: true }                 // return updated doc
  );

  if (!updated) throw new Error('no capacity');
  return updated.toObject();      // keep the return lightweight and plain
}

// Release ONE space back after checkout/cancel.
async function release(petType) {
  const key = keyFor(petType);
  await Inventory.findOneAndUpdate(
    {},
    { $inc: { [key]: 1 } },
    { upsert: true }
  );
}

// Readable snapshot for the CLI/dashboard.
// If no row exists (fresh DB), fall back to zeros so the UI has something to show.
async function showInventory() {
  return (await Inventory.findOne({}).lean()) || { dogSpaces: 0, catSpaces: 0 };
}

// Put inventory back to full (30/30) for demos/tests.
// Returns the latest doc so callers can print it immediately.
async function resetInventoryTo30() {
  await Inventory.updateOne(
    {},
    { $set: { dogSpaces: 30, catSpaces: 30 } },
    { upsert: true }
  );
  return showInventory();
}

// Exported API used by PetCheckInService and the CLI.
// Keep names stable: other modules assume reserve/release/show/reset exist.
module.exports = {
  ensureInventory,
  reserve,
  release,
  showInventory,
  resetInventoryTo30
};
