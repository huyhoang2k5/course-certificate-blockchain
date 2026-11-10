const fs = require("fs");
const path = require("path");

function resolveDatabasePath() {
  const uri = process.env.MONGODB_URI || "";
  const rawPath = uri.replace(/^file:/, "") || "./data/dev-db.json";
  return path.isAbsolute(rawPath)
    ? rawPath
    : path.join(__dirname, "..", "..", rawPath);
}

function readDatabase() {
  const databasePath = resolveDatabasePath();

  if (!fs.existsSync(databasePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(databasePath, "utf8"));
}

function writeDatabase(data) {
  const databasePath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

function matches(document, query = {}) {
  return Object.entries(query).every(([key, value]) => document[key] === value);
}

function createQuery(items) {
  return {
    sort(sortSpec = {}) {
      const [[field, direction] = []] = Object.entries(sortSpec);

      if (!field) {
        return Promise.resolve(items);
      }

      const sorted = [...items].sort((a, b) => {
        const left = a[field] ? new Date(a[field]).getTime() || a[field] : "";
        const right = b[field] ? new Date(b[field]).getTime() || b[field] : "";

        if (left === right) return 0;
        return left > right ? direction : -direction;
      });

      return Promise.resolve(sorted);
    },
    then(resolve, reject) {
      return Promise.resolve(items).then(resolve, reject);
    },
  };
}

function normalizeDocument(document, defaults = {}) {
  const now = new Date().toISOString();
  return {
    _id: document._id || `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    ...defaults,
    ...document,
    createdAt: document.createdAt || now,
    updatedAt: now,
  };
}

function createFileModel(collectionName, defaults = {}) {
  function getCollection() {
    const database = readDatabase();
    return {
      database,
      collection: database[collectionName] || [],
    };
  }

  return {
    async create(document) {
      const { database, collection } = getCollection();
      const saved = normalizeDocument(document, defaults);
      database[collectionName] = [...collection, saved];
      writeDatabase(database);
      return saved;
    },

    async findOne(query = {}) {
      const { collection } = getCollection();
      return collection.find((document) => matches(document, query)) || null;
    },

    find(query = {}) {
      const { collection } = getCollection();
      return createQuery(collection.filter((document) => matches(document, query)));
    },

    async findOneAndUpdate(query = {}, update = {}, options = {}) {
      const { database, collection } = getCollection();
      const index = collection.findIndex((document) => matches(document, query));

      if (index === -1) {
        if (!options.upsert) {
          return null;
        }

        const created = normalizeDocument({ ...query, ...defaults, ...update });
        database[collectionName] = [...collection, created];
        writeDatabase(database);
        return created;
      }

      const updated = normalizeDocument({
        ...collection[index],
        ...update,
        createdAt: collection[index].createdAt,
      });
      database[collectionName] = collection.map((document, currentIndex) =>
        currentIndex === index ? updated : document
      );
      writeDatabase(database);
      return updated;
    },
  };
}

module.exports = createFileModel;
