import { atomWithStorage, splitAtom } from "jotai/utils";

export const categoryTypes = { simple: "Einfach" } as const;

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: keyof typeof categoryTypes;
};

export const categoriesAtom = atomWithStorage("categories", [] as Category[]);

export const categoriesAtomSplit = splitAtom(
  categoriesAtom,
  (category) => category.id
);
