import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

import { addRxPlugin, createRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { categorySchema } from "../category/category";
import { useEffect, useState } from "react";
import { eventSchema } from "../category/event";

addRxPlugin(RxDBDevModePlugin);

const initialize = async () => {
  const database = await createRxDatabase({
    name: "healthapp",
    storage: getRxStorageDexie(),
    ignoreDuplicate: true,
  });

  await database.addCollections({
    categories: { schema: categorySchema },
    events: { schema: eventSchema },
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
