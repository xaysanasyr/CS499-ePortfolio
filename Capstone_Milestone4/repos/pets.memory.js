// simple in-memory repo for pets   
module.exports = () => {
  const store = []; // { _id, customerId, type, name, age }
  let id = 1;
  return {
    findOneByOwnerAndName: async (ownerId, name) =>
      store.find(p => p.customerId === ownerId && p.name === name) || null,
    create: async (p) => {
      const doc = { _id: String(id++), ...p };
      store.push(doc);
      return doc;
    },
    _all: () => store
  };
};
