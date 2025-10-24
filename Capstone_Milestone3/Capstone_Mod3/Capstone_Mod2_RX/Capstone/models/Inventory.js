// this class tracks open spaces for dogs and cats
// simple counters: down on reserve, up on release
// note: in a real multi-user system, I'd protect this with db-level transactions/locks

class Inventory {
  constructor({ dogSpaces = 30, catSpaces = 12 } = {}) {
    // validate once at start so I don’t deal with weird values later
    this.dog = Inventory.validate(dogSpaces);
    this.cat = Inventory.validate(catSpaces);
  }

  static validate(v) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) throw new Error('spaces must be >= 0');
    return n;
  }

  // hold a spot for a pet type
  // throws an error if we do not have space (service catches it and returns a friendly message)
  reserve(type) {
    if (type === 'dog') {
      if (this.dog < 1) throw new Error('no dog spaces');
      this.dog--;
    } else {
      if (this.cat < 1) throw new Error('no cat spaces');
      this.cat--;
    }
  }

  // give a spot back after checkout or cancellation
  // safe to call even if we later also sync with db counts
  release(type) {
    if (type === 'dog') this.dog++;
    else this.cat++;
  }
}

module.exports = Inventory;
