// start → find or make customer → find or make pet → check space
// if no space, say sorry → if space, pick days and grooming → save it → show confirmation → end
// notes:
// - this is the “business logic” layer (middle): not UI, not raw DB. just rules.
// - we inject repos so this file has no mongoose imports. easy to test.
// - we calculate price here so the amount is locked in at booking time.

const Customer = require('../models/Customer');
const Pet = require('../models/Pet');
const Booking = require('../models/Booking');
const Inventory = require('../models/Inventory');

class PetCheckInService {
  constructor({
    inventory = new Inventory(),                  // current counters for dog/cat spaces
    ratePerDay = { dog: 45, cat: 35 },           // simple rates; could move to db later
    groomingMenu = { bath: 25, full: 55 },       // simple add-on prices
    repos                                          // mongo repos injected from outside
    // repos must look like:
    // {
    //   customers: { findOneByPhoneOrEmail(phone, email), create(cust) },
    //   pets:      { findOneByOwnerAndName(ownerId, name), create(pet) },
    //   bookings:  { create(booking) }
    // }
  } = {}) {
    this.inventory = inventory;
    this.ratePerDay = ratePerDay;
    this.groomingMenu = groomingMenu;
    this.repos = repos;
  }

  // main flow used by an API route or CLI
  async checkIn({
    customerInput,        // { name, phone, email }
    petInput,             // { type, name, age }
    daysStay,             // number
    groomingOption = null // 'bath' | 'full' | null
  }) {
    // 1) enter or find customer
    // try to avoid duplicates using phone/email as soft keys (not perfect but fine for now)
    let customerDoc = await this.repos.customers.findOneByPhoneOrEmail(
      customerInput.phone,
      customerInput.email
    );
    if (!customerDoc) {
      // create a new customer if we did not find one
      // Customer class will validate and normalize fields
      const customer = new Customer(customerInput);
      customerDoc = await this.repos.customers.create(customer);
    }
    // customerDoc now exists and has an _id we can use

    // 2) enter or find pet (match on owner + pet name)
    // this assumes pet names are unique per owner, which is usually fine
    let petDoc = await this.repos.pets.findOneByOwnerAndName(
      customerDoc._id,
      petInput.name
    );
    if (!petDoc) {
      // make a new pet owned by this customer
      const pet = new Pet({ ...petInput, customerId: customerDoc._id });
      petDoc = await this.repos.pets.create(pet);
    }
    // petDoc now exists and has _id, type, name, etc.

    // 3) check availability for the pet type
    // this will throw if we have no space; we catch below to send a friendly message
    try {
      this.inventory.reserve(petDoc.type);
    } catch {
      // nothing else to do; we did not save anything yet, so just say sorry
      return { ok: false, message: 'Sorry, we have no more spots available.' };
    }

    // 4) pick days + grooming
    // pricing is simple and readable (base per-day * days + optional grooming)
    const base = this.ratePerDay[petDoc.type] * Number(daysStay);
    const grooming = groomingOption
      ? { type: groomingOption, price: this.groomingMenu[groomingOption] ?? 0 }
      : null;

    // 5) make the booking record in memory first (validates days and price)
    const booking = new Booking({
      pet: { id: petDoc._id, type: petDoc.type, name: petDoc.name },
      customer: { id: customerDoc._id, name: customerDoc.name },
      daysStay,
      grooming,
      amountDue: base + (grooming?.price ?? 0),
    });

    // 6) update MongoDB
    // single create call here; if you add more writes later, consider a transaction
    const bookingDoc = await this.repos.bookings.create(booking);

    // 7) show a simple confirmation
    // return only what the UI needs to render a receipt/confirmation screen
    return {
      ok: true,
      confirmation: {
        bookingId: bookingDoc._id,                  // can be shown or used to check status
        customer: customerDoc.name,                 // quick read for staff/customer
        pet: `${petDoc.name} (${petDoc.type})`,     // also human-friendly
        daysStay: booking.daysStay,
        grooming: booking.grooming?.type ?? 'none',
        amountDue: booking.amountDue
      }
    };
  }
}

module.exports = PetCheckInService;
