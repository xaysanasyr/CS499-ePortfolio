const Customer = require('../models/Customer');
const Pet = require('../models/Pet');
const Inventory = require('../services/inventory.service');
const BookingModel = require('../models/BookingModel');

class PetCheckInService {
  // Simple, overridable pricing so tests/demos can inject different rates/menus.
  constructor({ ratePerDay = { dog: 45, cat: 35 }, groomingMenu = { bath: 25, full: 55 } } = {}) {
    this.ratePerDay = ratePerDay;
    this.groomingMenu = groomingMenu;
  }

  // Check-in flow:
  // 1) find-or-create customer
  // 2) find-or-create pet (by owner + pet name)
  // 3) reserve capacity (atomic) based on pet type
  // 4) compute price (base * days + optional grooming)
  // 5) create booking (status OPEN)
  // 6) return a friendly confirmation
  async checkIn({ customerInput, petInput, daysStay, groomingOption = null }) {
    // ---- 1) customer: find by phone/email if provided, else create a new one
    const phone = customerInput.phone?.trim() || null;
    const email = customerInput.email?.trim()?.toLowerCase() || null;

    // We try to match by phone/email to avoid duplicate customers on repeat visits.
    // If neither is present, we skip the lookup and just create by name.
    let customerDoc = (phone || email)
      ? await Customer.findOne({
          $or: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
          ],
        })
      : null;

    if (!customerDoc) {
      // Minimal required fields; schema-level trimming/normalization keeps it clean.
      customerDoc = await Customer.create({
        name: String(customerInput.name || '').trim(),
        phone,
        email,
      });
    }

    // ---- 2) pet: find by ownerId + pet name so "Buddy" under this owner maps correctly
    const petName = String(petInput.name || '').trim();
    let petDoc = await Pet.findOne({ ownerId: customerDoc._id, name: petName });

    if (!petDoc) {
      // Create on the fly for fast intake; we normalize type to 'dog' | 'cat'.
      // Age is trusted here; schema validates whole number >= 0.
      petDoc = await Pet.create({
        type: String(petInput.type || '').trim().toLowerCase(), // 'dog' | 'cat'
        name: petName,
        age: Number(petInput.age),
        ownerId: customerDoc._id,
      });
    }

    // ---- 3) capacity: try to reserve exactly one spot for this species
    try {
      await Inventory.reserve(petDoc.type); // atomic decrement; throws when full
    } catch {
      // Friendly user message; we don't leak "no capacity field" tech detail to the UI.
      return { ok: false, message: 'Sorry, we have no more spots available.' };
    }

    // ---- 4) pricing: base (rate * nights) + optional grooming add-on
    const base = (this.ratePerDay[petDoc.type] || 0) * Number(daysStay);

    // We snapshot grooming type/price now so receipts stay stable
    // even if the menu changes later.
    const grooming = groomingOption
      ? { type: groomingOption, price: this.groomingMenu[groomingOption] ?? 0 }
      : null;

    const amountDue = base + (grooming?.price ?? 0);

    // ---- 5) persist booking (status defaults to OPEN via schema)
    const bookingDoc = await BookingModel.create({
      pet: { id: petDoc._id, type: petDoc.type, name: petDoc.name },      // snapshot + refs
      customer: { id: customerDoc._id, name: customerDoc.name },           // snapshot + refs
      daysStay: Number(daysStay),
      grooming,
      amountDue,
    });

    // ---- 6) success response: keep it minimal and readable for the CLI/UI
    return {
      ok: true,
      confirmation: {
        bookingId: bookingDoc._id,
        customer: customerDoc.name,
        pet: `${petDoc.name} (${petDoc.type})`,
        daysStay: bookingDoc.daysStay,
        grooming: bookingDoc.grooming?.type ?? 'none',
        amountDue: bookingDoc.amountDue,
      },
    };
  } // <-- properly close checkIn

  // Check-out flow:
  // 1) find customer by name (fast path for CLI)
  // 2) find pet by (owner, pet name)
  // 3) get latest OPEN booking (guard: only one should be open)
  // 4) set status CLOSED, timestamp checkout
  // 5) release capacity
  // 6) return a receipt
  async checkOut({ ownerName, petName }) {
    // ---- 1) customer lookup (by name here; could be by phone/email in API version)
    const customer = await Customer.findOne({ name: ownerName.trim() });
    if (!customer) return { ok: false, message: 'Owner not found' };

    // ---- 2) pet lookup under that owner
    const pet = await Pet.findOne({ ownerId: customer._id, name: petName.trim() });
    if (!pet) return { ok: false, message: 'Pet not found for this owner' };

    // ---- 3) open booking: we always close the most recent one if multiples exist
    const booking = await BookingModel.findOne({
      'customer.id': customer._id,
      'pet.id': pet._id,
      status: 'OPEN',
    }).sort({ createdAt: -1 });

    if (!booking) return { ok: false, message: 'No open booking found for this pet' };

    // ---- 4) close booking and timestamp the checkout
    booking.status = 'CLOSED';
    booking.checkOutAt = new Date();
    await booking.save();

    // ---- 5) release capacity so the space becomes available again
    await Inventory.release(pet.type);

    // ---- 6) return a simple receipt for the front desk
    return {
      ok: true,
      receipt: {
        bookingId: booking._id,
        customer: customer.name,
        pet: `${pet.name} (${pet.type})`,
        nights: booking.daysStay,
        amountPaid: booking.amountDue,
        checkOutAt: booking.checkOutAt,
      },
    };
  }
}

module.exports = PetCheckInService;
