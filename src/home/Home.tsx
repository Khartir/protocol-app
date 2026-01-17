import { Button, Divider } from "@mui/material";
import { useAtom } from "jotai";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { TargetList } from "./TargetList";
import { EventsList } from "./EventsList";
import { selectedDate } from "./atoms";

export function Home() {
  return (
    <>
      <DateSelect />
      <TargetList />
      <Divider />
      <EventsList />
    </>
  );
}

export function DateSelect() {
  const [date, setDate] = useAtom(selectedDate);
  return (
    <>
      <DatePicker
        value={dayjs(date)}
        sx={{ width: "10rem" }}
        onAccept={(value) => {
          if (value) {
            setDate(value.valueOf());
          }
        }}
      />
      <Button
        variant="outlined"
        size="large"
        onClick={() => setDate(dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf())}
      >
        Heute
      </Button>
    </>
  );
}
