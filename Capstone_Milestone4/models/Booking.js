// this class is a single check-in record
// it ties together the customer, the pet, how many days, any grooming add-on, and the price
// keep this focused on data we need to show and store; no business rules here beyond validation

class Booking {
  constructor({ pet, customer, daysStay, grooming = null, amountDue = 0 }) {
    // pet and customer must exist (we store small snapshots, not the whole doc)
    if (!pet) throw new Error('pet required');               // expect { id, type, name }
    if (!customer) throw new Error('customer required');     // expect { id, name }

    // snapshots are easier to read in confirmations and receipts
    this.pet = pet;                 // { id, type, name }
    this.customer = customer;       // { id, name }

    // days must be positive and whole
    this.daysStay = Booking.validateDays(daysStay);

    // grooming can be null or a small object like { type: 'bath', price: 25 }
    // we do not calculate price here; that is service logic
    this.grooming = grooming;

    // price should be final amount ready to show/pay
    this.amountDue = Booking.validateAmount(amountDue);

    // timestamp for audit/history
    this.createdAt = new Date();
  }

  static validateDays(v) {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) throw new Error('daysStay must be > 0');
    return n;
  }

  static validateAmount(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new Error('amountDue must be >= 0');
    return n;
  }
}

module.exports = Booking;
