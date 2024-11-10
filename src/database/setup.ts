import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

import { addRxPlugin, createRxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { categorySchema } from "../category/category";
import { useEffect, useState } from "react";
import { eventSchema } from "../category/event";
import { targetSchema } from "../category/target";

addRxPlugin(RxDBDevModePlugin);

const initialize = async (count: number = 0) => {
  const storage = getRxStorageDexie();
  const database = await createRxDatabase({
    name: "healthapp",
    storage,
    ignoreDuplicate: true,
  });

  try {
    await database.addCollections({
      categories: { schema: categorySchema },
      events: { schema: eventSchema },
      targets: { schema: targetSchema },
    });
  } catch (e) {
    if (count === 0) {
      await removeRxDatabase("healthapp", storage);
      return initialize();
    }
    throw e;
  }

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
