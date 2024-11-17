import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

import { addRxPlugin, createRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { categorySchema } from "../category/category";
import { useEffect, useState } from "react";
import { eventSchema } from "../category/event";
import { targetSchema } from "../category/target";

if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}

const initialize = async () => {
  const storage = getRxStorageDexie();
  const database = await createRxDatabase({
    name: "healthapp",
    storage,
    ignoreDuplicate: true,
  });

  await database.addCollections({
    categories: { schema: categorySchema },
    events: { schema: eventSchema },
    targets: { schema: targetSchema },
  });

  return database;
};

type Database = Awaited<ReturnType<typeof initialize>>;

export const useDatabase = () => {
  const [db, setDb] = useState<Database>();

  useEffect(() => {
    initialize().then(setDb);
  }, []);

  return db;
};
