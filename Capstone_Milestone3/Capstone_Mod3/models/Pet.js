// this class is only about the pet object
// goal: keep pet data clean, predictable, and easy to validate
// used anywhere we need a pet (api, ui, db)
// no database details here on purpose (thin and portable)

class Pet {
  constructor({ type, name, age, customerId = null }) {
    // normalize + validate everything up front so the rest of the app can trust it
    this.type = Pet.validateType(type);   // only 'dog' or 'cat'
    this.name = Pet.validateName(name);   // non-empty text, trim spaces
    this.age  = Pet.validateAge(age);     // integer >= 0
    this.customerId = customerId;         // optional link to owner; can be null until we know it
  }

  // keep validations small and clear
  // note: we use errors to stop bad data early
  static validateType(v) {
    const t = String(v ?? '').trim().toLowerCase();
    if (t !== 'dog' && t !== 'cat') throw new Error('type must be dog or cat');
    return t;
  }

  static validateName(v) {
    if (typeof v !== 'string') throw new Error('name required');
    const name = v.trim();
    if (!name) throw new Error('name required');
    // optional: limit length so ui/db don’t get weird (skip for now)
    return name;
  }

  static validateAge(v) {
    const n = Number(v);
    if (!Number.isInteger(n)) throw new Error('age must be an integer');
    if (n < 0) throw new Error('age must be >= 0');
    return n;
  }
}

module.exports = Pet;
