import { Heading } from "../styling/Heading";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  CircularProgressProps,
  Box,
} from "@mui/material";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { useGetTargetsForDate, Target, useGetTargetStatus } from "../category/target";
import { selectedDate } from "./Home";
import { requiresInput, useGetCategory } from "../category/category";
import { Event, useGetEventsCollection } from "../category/event";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { v7 as uuid } from "uuid";
import { EventsDialog } from "./EventsDialog";
export function TargetList() {
  const date = useAtomValue(selectedDate);
  const targets = useGetTargetsForDate(date, dayjs(date).add(1, "day").valueOf());
  return (
    <>
      <Heading>Ziele</Heading>
      <List>
        {targets.map((target) => (
          <Row target={target} key={target.id} />
        ))}
      </List>
    </>
  );
}

function Row({ target }: { target: RxDocument<Target> }) {
  const category = useGetCategory(target.category);
  const collection = useGetEventsCollection();
  const [open, setOpen] = useState(false);
  const date = useAtomValue(selectedDate);
  const now = dayjs();

  const event = {
    category: target.category,
    timestamp: dayjs(date).hour(now.hour()).minute(now.minute()).second(now.second()).valueOf(),
    id: uuid(),
    data: "",
  };

  const showDialog =
    dayjs().hour(0).minute(0).second(0).millisecond(0).isBefore(dayjs(date)) ||
    requiresInput(category?.type);

  const handleClick = () => {
    if (showDialog) {
      setOpen(true);
      return;
    }
    collection?.insert(event);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const persist = (data: Event) => collection?.insert(data);

  const { value, percentage, expected, color } = useGetTargetStatus(target);
  let secondary = value;
  if (expected) {
    secondary += " von " + expected;
  }

  return (
    <>
      <ListItem key={target.id} disablePadding>
        <ListItemButton onClick={handleClick}>
          <ListItemIcon>
            <CircularProgressWithLabel
              sx={{
                color,
              }}
              variant="determinate"
              value={percentage}
              label={category?.icon}
            />
          </ListItemIcon>
          <ListItemText primary={target.name} secondary={secondary} />
        </ListItemButton>
      </ListItem>

      {showDialog && (
        <EventsDialog event={event} handleClose={handleClose} open={open} persist={persist} />
      )}
    </>
  );
}

function CircularProgressWithLabel({
  label,
  ...props
}: CircularProgressProps & { value: number; label: string | undefined }) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
