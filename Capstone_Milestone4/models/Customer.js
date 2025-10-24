// this class is only about the customer object
// goal: basic info so we can contact them and attach pets
// not handling complex validation like email regex here; keep it simple

class Customer {
  constructor({ id = null, name, phone = null, email = null }) {
    // name is the only hard requirement at this level
    if (!name || !String(name).trim()) throw new Error('customer name required');

    this.id = id;                         // db id or null if not saved yet
    this.name = String(name).trim();      // trim spaces so "  Sam  " becomes "Sam"
    this.phone = phone;                   // optional; format checks can live in api layer if needed
    this.email = email;                   // optional; same note as phone
  }
}

module.exports = Customer;
