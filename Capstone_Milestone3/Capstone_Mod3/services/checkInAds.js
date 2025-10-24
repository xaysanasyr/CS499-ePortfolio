
// Goal/Purpose: simple in-memory check-in engine so I can prove the logic first.
// Why this file exists: practice core data structures (Map, Queue, Stack, binary search) before wiring a DB.

class Inventory {
  // tracks open spaces for cats/dogs and hands out a simple space id
  constructor({ dogSpaces = 30, catSpaces = 12 } = {}) {
    this.dogSpacesAvailable = dogSpaces;
    this.catSpacesAvailable = catSpaces;
    this._nextDog = 1; // next dog space label counter
    this._nextCat = 1; // next cat space label counter
  }

  // check capacity for a type
  hasSpaceFor(type) {
    if (type === "dog") return this.dogSpacesAvailable > 0;
    if (type === "cat") return this.catSpacesAvailable > 0;
    return false; // unknown type
  }

  // reserve a spot and return its id (like D-1, C-1)
  assignSpace(type) {
    if (!this.hasSpaceFor(type)) return null;
    if (type === "dog") {
      this.dogSpacesAvailable -= 1;         // use one dog space
      return `D-${this._nextDog++}`;        // hand out label then increment
    }
    if (type === "cat") {
      this.catSpacesAvailable -= 1;         // use one cat space
      return `C-${this._nextCat++}`;
    }
    return null;
  }

  // put a spot back (used by undo)
  releaseSpace(type) {
    if (type === "dog") this.dogSpacesAvailable += 1;
    if (type === "cat") this.catSpacesAvailable += 1;
  }
}

class CheckInEngine {
  constructor({ dogSpaces = 30, catSpaces = 12 } = {}) {
    // Maps act like HashMaps: fast add/find by id
    this.customersById = new Map(); // id -> customer object
    this.petsById = new Map();      // id -> pet object

    // sorted array for name lookups with binary search
    // each row is tiny: { nameLower, petId }
    this.petsByNameSorted = [];

    // simple Queue for check-ins (FIFO = first come, first served)
    this.checkInQueue = [];

    // Stack for undo (LIFO = last thing done is first to undo)
    this.undoStack = [];

    // track capacity here, keep it dumb and obvious
    this.inventory = new Inventory({ dogSpaces, catSpaces });

    // tiny in-memory booking store
    this.bookings = new Map(); // bookingId -> booking
    this._nextBookingId = 1;   // counter for new booking ids
  }

  // -------- helpers (small and focused) --------

  // compare two lowercase names; used by binary search
  _cmpName(aLower, bLower) {
    if (aLower < bLower) return -1;
    if (aLower > bLower) return 1;
    return 0;
  }

  // binary search over petsByNameSorted
  // returns { found, idx } where idx is either exact match index or insert spot
  _bsearchName(nameLower) {
    let left = 0;
    let right = this.petsByNameSorted.length - 1;
    while (left <= right) {
      const mid = (left + right) >> 1; // fast floor((l+r)/2)
      const cmp = this._cmpName(nameLower, this.petsByNameSorted[mid].nameLower);
      if (cmp === 0) return { found: true, idx: mid };
      if (cmp < 0) right = mid - 1;
      else left = mid + 1;
    }
    return { found: false, idx: left }; // not found; left is where it should go
  }

  // keep the name index sorted on insert (so our search stays O(log n))
  _insertNameIndex(name, petId) {
    const nameLower = String(name).toLowerCase();
    const { idx } = this._bsearchName(nameLower);
    this.petsByNameSorted.splice(idx, 0, { nameLower, petId }); // insert at spot
  }

  // remove one copy of petId from the queue (used by undo)
  _removeFromQueueOnce(petId) {
    let removed = false;
    const next = [];
    for (const id of this.checkInQueue) {
      if (!removed && id === petId) {
        removed = true; // skip this one time
        continue;
      }
      next.push(id);
    }
    this.checkInQueue = next;
    return removed;
  }

  // -------- public API (what other files will call) --------

  // add or reuse a customer by id
  addOrFindCustomer(customer) {
    // expected: { id, name, ... }
    if (this.customersById.has(customer.id)) return this.customersById.get(customer.id);
    this.customersById.set(customer.id, customer);
    return customer;
  }

  // add a pet and line them up for check-in
  addPet(pet) {
    // expected: { id, name, type: "dog"|"cat", age, ownerId }
    if (!pet || !pet.id || !pet.name || !pet.type) {
      throw new Error("pet requires id, name, and type"); // keep the contract tight
    }
    this.petsById.set(pet.id, pet);       // store full pet
    this._insertNameIndex(pet.name, pet.id); // index by name for fast search

    this.checkInQueue.push(pet.id);          // add to the line (FIFO)
    this.undoStack.push({ type: "ADD_PET_ENQUEUE", petId: pet.id }); // allow undo
    return pet;
  }

  // find a pet by name (case-insensitive) using binary search
  findPetByName(name) {
    const nameLower = String(name).toLowerCase();
    const pos = this._bsearchName(nameLower);
    if (pos.found) {
      const { petId } = this.petsByNameSorted[pos.idx];
      return this.petsById.get(petId) || null; // return full pet or null
    }
    return null;
  }

  // confirm a single check-in (reserve space + create booking)
  confirmCheckIn(petId, { days = 1, grooming = false } = {}) {
    const pet = this.petsById.get(petId);
    if (!pet) return { ok: false, message: "Pet not found." };

    // capacity check first (fast fail)
    if (!this.inventory.hasSpaceFor(pet.type)) {
      return { ok: false, message: "Sorry, we have no more spots available." };
    }

    // give them a space and note the booking
    const spaceId = this.inventory.assignSpace(pet.type);
    const bookingId = String(this._nextBookingId++);
    const booking = {
      id: bookingId,
      petId,
      days,
      grooming,
      spaceId,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
    this.bookings.set(bookingId, booking);

    // add undo so we can roll this back cleanly
    this.undoStack.push({
      type: "CHECK_IN_CONFIRMED",
      petId,
      spaceId,
      bookingId,
    });

    return { ok: true, booking };
  }

  // take the next pet in line and try to check them in
  processNext({ days = 1, grooming = false } = {}) {
    if (this.checkInQueue.length === 0) return { ok: false, message: "Queue empty." };
    const petId = this.checkInQueue.shift();          // FIFO: get first
    const result = this.confirmCheckIn(petId, { days, grooming });
    return { ...result, petId };                      // also tell which pet we tried
  }

  // run the whole line until empty
  processAll({ days = 1, grooming = false } = {}) {
    const results = [];
    while (this.checkInQueue.length > 0) {
      results.push(this.processNext({ days, grooming }));
    }
    return results; // list of outcomes (ok + booking or fail message)
  }

  // undo the most recent action (either dequeue add or a confirmed booking)
  undoRecent() {
    if (this.undoStack.length === 0) return { ok: false, message: "Nothing to undo." };
    const action = this.undoStack.pop();

    if (action.type === "ADD_PET_ENQUEUE") {
      // try to remove that pet from the waiting line
      const removed = this._removeFromQueueOnce(action.petId);
      return { ok: true, message: removed ? "Undid add + enqueue." : "Nothing to remove from queue." };
    }

    if (action.type === "CHECK_IN_CONFIRMED") {
      // remove the booking and give the space back
      const booking = this.bookings.get(action.bookingId);
      if (booking) {
        this.bookings.delete(action.bookingId);
        const pet = this.petsById.get(action.petId);
        if (pet) this.inventory.releaseSpace(pet.type); // return capacity
        return { ok: true, message: "Undid confirmed check-in." };
      }
      return { ok: false, message: "Booking not found to undo." };
    }

    // if we add more action types later, handle them here
    return { ok: false, message: "No handler for undo action." };
  }

  // quick snapshot of state for debugging/logging
  getState() {
    return {
      customers: this.customersById.size,
      pets: this.petsById.size,
      queueLength: this.checkInQueue.length,
      undoDepth: this.undoStack.length,
      inventory: {
        dogSpacesAvailable: this.inventory.dogSpacesAvailable,
        catSpacesAvailable: this.inventory.catSpacesAvailable,
      },
      bookingsCount: this.bookings.size,
    };
  }
}

module.exports = { CheckInEngine };
