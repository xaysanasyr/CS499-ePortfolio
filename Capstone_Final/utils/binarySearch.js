function binarySearch(arr, target) {
  // search window: [lo, hi]
  let lo = 0, hi = arr.length - 1;

  while (lo <= hi) {
    // midpoint without overflow; >>> 1 is a fast floor((lo+hi)/2)
    const mid = (lo + hi) >>> 1;

    // found it—return the index right away
    if (arr[mid] === target) return mid;

    // standard ordered split:
    // if middle is less than target, drop the left half; otherwise drop the right half
    if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  // not found
  return -1;
}

module.exports = { binarySearch };

