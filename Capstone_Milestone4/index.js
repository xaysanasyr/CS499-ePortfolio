// index.js
// goal: tiny api to run the pet check-in flow end to end
// simple today (in-memory). later we can switch to mongo with one flag.
// keep comments short and direct so I know what is going on.

require('dotenv').config?.(); // optional: if you use a .env file

const express = require('express');
const PetCheckInService = require('./services/petcheckinservice');

// ----- config with safe defaults
// change with env vars if you want
const PORT = Number(process.env.PORT || 3000);
const USE_MONGO = process.env.USE_MONGO === '1'; // "1" means use real db, anything else uses memory
const RATES = { dog: 45, cat: 35 };              // daily rates (simple and clear)
const GROOMING = { bath: 25, full: 55 };         // add-on menu

// ----- repos wiring
// idea: the service does not care if this is memory or mongo.
// we choose the implementation here once.
let repos;

if (USE_MONGO) {
  // using real mongo + mongoose
  // note: you need to set up your mongoose connection and models for this branch to work
  // keep this block small so it is easy to read

  const mongoose = require('mongoose');

  // connect once. keep uri in env var MONGODB_URI
  // example: mongodb://127.0.0.1:27017/petcheckin
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('missing MONGODB_URI. set it in env or .env file.');
    process.exit(1);
  }

  // connect and log basic status
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('mongo connected'))
    .catch(err => {
      console.error('mongo connection failed:', err.message);
      process.exit(1);
    });

  // load your mongoose models (you will create these files later)
  // keep names short and match your repos assumptions
  const CustomerModel = require('./db/CustomerModel'); // make this later
  const PetModel = require('./db/PetModel');           // make this later
  const BookingModel = require('./db/BookingModel');   // make this later

  // wrap models with mongo repos (just adapters)
  repos = {
    customers: require('./repos/customers.mongo')(CustomerModel),
    pets: require('./repos/pets.mongo')(PetModel),
    bookings: require('./repos/bookings.mongo')(BookingModel),
  };
} else {
  // default: in-memory repos so we can run right now with no database
  // these keep data in simple arrays. good for local testing and demos.
  repos = {
    customers: require('./repos/customers.memory')(),
    pets: require('./repos/pets.memory')(),
    bookings: require('./repos/bookings.memory')(),
  };
}

// ----- make the service
// pass in rates and grooming so we keep all money logic in one spot
const service = new PetCheckInService({
  repos,
  ratePerDay: RATES,
  groomingMenu: GROOMING,
  // inventory uses defaults (dog=30, cat=12). change inside the class if needed.
});

// ----- express app
const app = express();

// parse json bodies
app.use(express.json());

// simple health check so we know server is alive
app.get('/health', (_req, res) => {
  // keep it boring and reliable
  res.json({ ok: true, status: 'up' });
});

// main api route to check in a pet
// expects json body with customerInput, petInput, daysStay, groomingOption
// returns either ok:true with confirmation or ok:false with friendly message
app.post('/checkin', async (req, res) => {
  try {
    // run the flow; service returns either ok:true with confirmation
    // or ok:false with a friendly message (like "no more spots")
    const result = await service.checkIn(req.body);

    // if no space, return 409 (conflict). if success, 200.
    res.status(result.ok ? 200 : 409).json(result);
  } catch (e) {
    // any validation error or unexpected bug ends up here
    // we keep the message simple and do not leak stack traces to clients
    res.status(400).json({ ok: false, message: e.message });
  }
});

