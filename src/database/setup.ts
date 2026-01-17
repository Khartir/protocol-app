import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

import { addRxPlugin, createRxDatabase, RxStorage } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { categoryCollection } from "../category/category";
import { useEffect, useState } from "react";
import { eventSchema } from "../category/event";
import { targetCollection } from "../category/target";
import { RxDBJsonDumpPlugin } from "rxdb/plugins/json-dump";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { graphCollection } from "../analytics/graph";

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

const initialize = async () => {
  const storage = getStorage();
  const database = await createRxDatabase({
    name: "healthapp",
    storage,
    ignoreDuplicate: import.meta.env.DEV,
  });

  await database.addCollections({
    categories: categoryCollection,
    events: { schema: eventSchema },
    targets: targetCollection,
    graphs: graphCollection,
  });

  return database;
};

export type Database = Awaited<ReturnType<typeof initialize>>;

// Cache the database promise to prevent duplicate initialization in StrictMode
let dbPromise: Promise<Database> | null = null;

export const useDatabase = () => {
  const [db, setDb] = useState<Database>();

  useEffect(() => {
    if (!dbPromise) {
      dbPromise = initialize();
    }
    dbPromise.then(setDb);
  }, []);

  return db;
};

function getStorage() {
  let storage: RxStorage<unknown, unknown> = getRxStorageDexie();
  if (import.meta.env.DEV) {
    storage = wrappedValidateAjvStorage({ storage });
  }
  return storage;
}
