import { atom } from "jotai";
import dayjs from "dayjs";

export const selectedDate = atom(dayjs().startOf("day").valueOf());
