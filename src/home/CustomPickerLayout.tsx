import { Dayjs } from "dayjs";
import {
  PickersLayoutRoot,
  PickersLayoutContentWrapper,
  usePickerLayout,
  PickersLayoutProps,
} from "@mui/x-date-pickers/PickersLayout";

export function CustomPickerLayout(props: PickersLayoutProps<Dayjs | null>) {
  const { toolbar, tabs, content, actionBar, shortcuts, ownerState } = usePickerLayout(props);

  return (
    <PickersLayoutRoot
      ownerState={ownerState}
      sx={{
        justifyItems: "center",
        "& .MuiPickersToolbar-content": {
          pt: 0,
          pb: 1,
        },
        "& .MuiPickersToolbar-root": {
          p: 0,
        },
      }}
    >
      {toolbar}
      <PickersLayoutContentWrapper ownerState={ownerState} sx={{ alignItems: "center" }}>
        {shortcuts}
        {tabs}
        {content}
      </PickersLayoutContentWrapper>
      {actionBar}
    </PickersLayoutRoot>
  );
}
