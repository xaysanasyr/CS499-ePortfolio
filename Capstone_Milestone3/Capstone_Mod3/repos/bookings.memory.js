// simple in-memory repo for bookings 
module.exports = () => {
  const store = []; // { _id, pet, customer, daysStay, grooming, amountDue, createdAt }
  let id = 1;
  return {
    create: async (b) => {
      const doc = { _id: String(id++), ...b };
      store.push(doc);
      return doc;
    },
    _all: () => store
  };
};
