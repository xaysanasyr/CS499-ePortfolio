// simple in-memory repo for customers
module.exports = () => {
  const store = []; // { _id, name, phone, email }
  let id = 1;
  return {
    findOneByPhoneOrEmail: async (phone, email) =>
      store.find(c => (phone && c.phone === phone) || (email && c.email === email)) || null,
    create: async (c) => {
      const doc = { _id: String(id++), ...c };
      store.push(doc);
      return doc;
    },
    // helpful for tests
    _all: () => store
  };
};
