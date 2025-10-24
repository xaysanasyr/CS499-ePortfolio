const Pet = require('../models/Pet');
const { binarySearch } = require('../utils/binarysearch');

async function findPetByNameBinary(target) {
  // Pull just the 'name' field for all pets to keep this lightweight.
  // .lean() returns plain objects (faster, less memory than Mongoose docs).
  const names = (await Pet.find({}, { name: 1, _id: 0 }).lean())
    .map(x => x.name)
    // Sort required for binary search correctness.
    // Default JS sort is lexicographic; good enough for simple ASCII names.
    // If you want locale/case-insensitive sorting, see notes below.
    .sort();

  // Run the binary search over the sorted names.
  // Your util should return index >= 0 when found, -1 when not found.
  const idx = binarySearch(names, target);

  // Return a tiny summary object that the CLI can print nicely.
  return { found: idx >= 0, index: idx, namesCount: names.length };
}

module.exports = { findPetByNameBinary };
