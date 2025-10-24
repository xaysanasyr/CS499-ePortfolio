const Inventory = require('../models/Inventory');

// Ensure we have exactly one inventory row before the app starts taking bookings.
// If nothing exists, seed defaults (30/30). In real life, read these from config.
async function ensureInventory() {
  const existing = await Inventory.findOne();
  if (!existing) await Inventory.create({ dogSpaces: 30, catSpaces: 30 });
}

// Helper: pick the right field for the species.
// We normalize input to lowercase and default to catSpaces if not 'dog'.
function keyFor(type) {
  const t = String(type || '').toLowerCase().trim();
  return t === 'dog' ? 'dogSpaces' : 'catSpaces';
}

// Reserve ONE space for a pet type.
// - Atomic: uses findOneAndUpdate with $gt and $inc to avoid overbooking.
// - If no space is left, we throw 'no capacity' so the caller can show a friendly error.
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
// - We upsert to be safe (dev environments sometimes drop collections).
// - Business rule: we do not cap the max here; service layer can add a max if needed.
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

// Dev helper: put inventory back to full (30/30) for demos/tests.
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
