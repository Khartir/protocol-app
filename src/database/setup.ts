import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

import { addRxPlugin, createRxDatabase, RxStorage } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { categoryCollection } from "../category/category";
import { useEffect, useState } from "react";
import { eventSchema } from "../category/event";
import { targetSchema } from "../category/target";
import { RxDBJsonDumpPlugin } from "rxdb/plugins/json-dump";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { graphCollection } from "../analytics/graph";

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

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
    targets: { schema: targetSchema },
    graphs: graphCollection,
  });

  return database;
};

export type Database = Awaited<ReturnType<typeof initialize>>;

export const useDatabase = () => {
  const [db, setDb] = useState<Database>();

  useEffect(() => {
    initialize().then(setDb);
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
