// cli/main.js

// Load variables from .env so we can keep secrets (like DB URI) out of code.
// Example .env keys that this app reads: MONGODB_URI, MONGODB_DB
require('dotenv').config();

const mongoose = require('mongoose');
const rs = require('readline-sync');

// ---- services (use correct relative paths from /cli) ----
// PetCheckInService is our main "business logic" class. It knows how to check pets in/out.
const PetCheckInService = require('../services/PetCheckInService'); // class with checkIn/checkOut

// These optional service modules let the CLI do extra things (reports, inventory, search).
// We "try/catch" each require so the CLI still runs even if a file is missing during development.
let inventorySvc = {};
let reportsSvc = {};
let searchSvc = {};
try { inventorySvc = require('../services/inventory.service'); } catch {}   // inventory helpers
try { reportsSvc = require('../services/reports.service'); } catch {}       // reporting helpers
try { searchSvc = require('../services/search.service'); } catch {}          // binary search demo

// Pull out functions from the services. If a service is missing, we fall back to safe defaults.
// This avoids "is not a function" crashes later and lets us show a friendly message instead.
const {
  ensureInventory = async () => {},  // creates/initializes the single inventory doc if needed
  showInventory = null,               // returns a string or object describing current capacity
  resetInventoryTo30 = null           // dev helper: hard reset to full capacity for demos/tests
} = inventorySvc;

const {
  revenueByDay = null                // report helper: returns [{ date, revenue }] for console.table
} = reportsSvc;

const {
  findPetByNameBinary = null         // algorithm demo: binary search on a sorted list of pet names
} = searchSvc;

// Register Mongoose models once up front so services can use them.
// If you move files, fix the paths here (these paths are from /cli folder).
require('../models/Customer');
require('../models/Pet');
require('../models/Inventory');
require('../models/BookingModel');

// Wrap the whole CLI in an async IIFE so we can use await cleanly.
(async function run() {
  try {
    // ---- single, consistent Mongo connection ----
    // We support either MONGODB_URI or MONGO_URI in .env to be flexible.
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const dbName = process.env.MONGODB_DB || 'petcheckin';

    // If there is no DB URI, we stop early with a clear message instead of crashing mysteriously.
    if (!uri) {
      console.error('Missing MONGODB_URI (or MONGO_URI). Add it to .env.');
      process.exit(1);
    }

    // Connect once and reuse the connection for the whole CLI session.
    await mongoose.connect(uri, { dbName });

    // Make sure our single inventory/capacity document exists before taking any bookings.
    await ensureInventory();

    // Create the main service that knows how to check pets in and out.
    const svc = new PetCheckInService();

    console.log('\n🐾 PetCheckIn (Console)\n');

    // ---- CLI main loop ----
    // We stay in this loop until the user chooses "0) Exit".
    // Each option calls into a small task: check-in, report, search, check-out, etc.
    let running = true;
    while (running) {
      console.log(`
1) Check in a pet
2) Revenue by day
3) Find pet by name (binary search)
4) Check out a pet
5) Show inventory
6) Reset capacity to 30
0) Exit`);
      const choice = rs.question('> ').trim();

      // We wrap each action in a try/catch so one bad input doesn't kill the whole program.
      try {
        // ---- 1) Check in a pet ----
        // We collect just enough info to make a booking: who owns the pet, pet details,
        // how long the stay is, and whether any grooming is requested.
        if (choice === '1') {
          const customerInput = {
            // We keep customer fields simple; phone/email are optional to reduce friction.
            name: rs.question('Customer name: '),
            phone: rs.question('Phone (optional): '),
            // Using questionEMail gives basic validation; we allow blank by providing a default.
            email: rs.questionEMail('Email (optional, blank to skip): ', { defaultInput: '' })
          };
          const petInput = {
            // Normalize type to lowercase so "Dog", "DOG" all become "dog".
            type: rs.question('Pet type (dog or cat): ').trim().toLowerCase(),
            name: rs.question('Pet name: '),
            // Age must be a number; Number(...) converts string to number (NaN if invalid).
            age: Number(rs.question('Pet age (years): '))
          };
          const daysStay = Number(rs.question('Days of stay: '));
          // Grooming is optional. If user types "none" or leaves blank, we store null.
          const g = rs.question('Grooming (none, bath, full): ').trim();
          const groomingOption = g && g !== 'none' ? g : null;

          // The service returns a result object with ok, message, and confirmation if success.
          const result = await svc.checkIn({ customerInput, petInput, daysStay, groomingOption });
          if (!result.ok) {
            // Show a clear error returned from the service (e.g., invalid type or no capacity).
            console.log('❌ ' + result.message);
          } else {
            // On success, we print a friendly confirmation/receipt right away.
            const c = result.confirmation;
            console.log(`✅ Booking ${c.bookingId}
Customer: ${c.customer}
Pet: ${c.pet}
Days: ${c.daysStay}
Grooming: ${c.grooming}
Amount Due: $${c.amountDue}`);
          }

        // ---- 2) Revenue by day ----
        // This is a tiny report to verify money flow quickly while developing.
        } else if (choice === '2') {
          if (!revenueByDay) {
            console.log('Revenue service not wired.');
          } else {
            // console.table formats arrays of objects in a readable table for the terminal.
            console.table(await revenueByDay());
          }

        // ---- 3) Find pet by name (binary search) ----
        // This exists to demonstrate an algorithm/data-structures enhancement.
        } else if (choice === '3') {
          if (!findPetByNameBinary) {
            console.log('Search service not wired.');
          } else {
            const name = rs.question('Name to search: ');
            // Service returns { found: boolean, index: number, namesCount: number }
            const r = await findPetByNameBinary(name);
            console.log(r.found ? `Found at index ${r.index}` : 'Not found', `(among ${r.namesCount} names)`);
          }

        // ---- 4) Check out a pet ----
        // Checkout closes the booking, calculates what is owed, and frees capacity.
        } else if (choice === '4') {
          const ownerName = rs.question('Owner name: ');
          const petName = rs.question('Pet name: ');
          const result = await svc.checkOut({ ownerName, petName });

          if (!result.ok) {
            console.log('❌ ' + result.message);
          } else {
            const r = result.receipt;
            // We print a simple checkout receipt so front desk has something to read back.
            console.log(`✅ Checked out
Booking: ${r.bookingId}
Customer: ${r.customer}
Pet: ${r.pet}
Nights: ${r.nights}
Amount Paid: $${r.amountPaid}
Time: ${new Date(r.checkOutAt).toLocaleString()}`);
          }

        // ---- 5) Show inventory ----
        // Quick peek at remaining dog/cat spaces. Good for demos and debugging capacity bugs.
        } else if (choice === '5') {
          if (!showInventory) {
            console.log('Inventory service not wired.');
          } else {
            console.log(await showInventory());
          }

        // ---- 6) Reset capacity to 30 ----
        // Developer shortcut: put everything back to "full house available" for testing.
        } else if (choice === '6') {
          if (!resetInventoryTo30) {
            console.log('Inventory service not wired.');
          } else {
            const doc = await resetInventoryTo30();
            console.log('Capacity reset to 30/30:', doc);
          }

        // ---- 0) Exit ----
        } else if (choice === '0') {
          running = false;

        // ---- Anything else ----
        // If the user typed something we don't know, we let them know and keep going.
        } else {
          console.log('Invalid option.');
        }

      } catch (e) {
        // Catch runtime errors inside the loop so we can continue without losing the session.
        console.error('Error:', e && e.stack ? e.stack : e);
      }
    }

    // We reach here when the user chooses to exit.
    await mongoose.disconnect(); // close DB connection cleanly
    console.log('Goodbye!');
    process.exit(0);

  } catch (err) {
    // If something fails before/after the loop, we still print a helpful stack.
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
