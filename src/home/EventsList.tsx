import { Heading } from "../styling/Heading";
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton } from "@mui/material";
import { useGetEventsForDate, Event, useGetEventsCollection } from "../category/event";
import { useAtomValue, useAtom } from "jotai";
import dayjs from "dayjs";
import { selectedDate } from "./Home";
import { useGetCategory } from "../category/category";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { v7 as uuid } from "uuid";
import { Delete } from "@mui/icons-material";
import { toBest } from "../MeasureSelect";
import { EventsDialog } from "./EventsDialog";
import { addState } from "../app/Menu";
import { useDeleteConfirm } from "../ConfirmDelete";
export function EventsList() {
  const date = useAtomValue(selectedDate);
  const { result: events } = useGetEventsForDate(date, dayjs(date).add(1, "day").valueOf());
  return (
    <>
      <Heading>Erledigt</Heading>
      <AddLayer />
      <List>
        {events.map((event) => (
          <Row event={event} key={event.id} />
        ))}
      </List>
    </>
  );
}

function Row({ event }: { event: RxDocument<Event> }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const { openDeleteConfirm, ConfirmDelete } = useDeleteConfirm(event);

  const category = useGetCategory(event.category);

  let secondary = event.data;

  if (category?.type === "valueAccumulative") {
    secondary = category && toBest(category, event.data).replace(".", ",");
  }

  return (
    <>
      <ListItem key={event.id} disablePadding>
        <ListItemButton onClick={handleClickOpen}>
          <ListItemIcon>{category?.icon}</ListItemIcon>
          <ListItemText primary={dayjs(event.timestamp).format("HH:mm")} secondary={secondary} />
          <ListItemIcon
            onClick={(e) => {
              e.stopPropagation();
              openDeleteConfirm();
            }}
          >
            <Delete />
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <EventsDialog
        event={event.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => event.patch(data)}
      />
      <ConfirmDelete />
    </>
  );
}

function AddLayer() {
  const [open, setOpen] = useAtom(addState);

  const handleClose = () => {
    setOpen(false);
  };

  const collection = useGetEventsCollection();

  const persist = (data: Event) =>
    collection?.insert({
      ...data,
      id: uuid(),
    });

  return (
    <>
      <EventsDialog
        event={{ category: "", id: "", timestamp: Date.now(), data: "" }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}
