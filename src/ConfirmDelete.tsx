import { Dialog, DialogContent, Button, DialogActions } from "@mui/material";
import { useState } from "react";
import { RxDocument } from "rxdb";

export function useDeleteConfirm(doc: RxDocument<any>) {
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const onDeleteConfirmClosed = () => {
    setOpenDeleteConfirm(false);
  };
  const onDeleteConfirm = () => {
    doc.remove();
    onDeleteConfirmClosed();
  };
  return {
    openDeleteConfirm: () => setOpenDeleteConfirm(true),
    ConfirmDelete: () => (
      <ConfirmDelete
        open={openDeleteConfirm}
        setClosed={onDeleteConfirmClosed}
        onConfirm={onDeleteConfirm}
      />
    ),
  };
}

function ConfirmDelete({
  onConfirm,
  open,
  setClosed,
}: {
  onConfirm: () => void;
  open: boolean;
  setClosed: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent>
        Wirklich löschen?
        <DialogActions>
          <Button variant="outlined" fullWidth onClick={setClosed}>
            Abbrechen
          </Button>
          <Button
            color="primary"
            variant="contained"
            fullWidth
            onClick={onConfirm}
          >
            Löschen
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
