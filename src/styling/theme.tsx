// import {
//   Link as RouterLink,
//   LinkProps as RouterLinkProps,
// } from "react-router-dom";
// import { LinkProps } from "@mui/material/Link";
// import React from "react";
import { createTheme } from "@mui/material";

// const LinkBehavior = React.forwardRef<
//   HTMLAnchorElement,
//   Omit<RouterLinkProps, "to"> & { href: RouterLinkProps["to"] }
// >((props, ref) => {
//   const { href, ...other } = props;
//   // Map href (Material UI) -> to (react-router)
//   return <RouterLink ref={ref} to={href} {...other} />;
// });

export const theme = createTheme({
  // components: {
  //   MuiLink: {
  //     defaultProps: {
  //       component: LinkBehavior,
  //     } as LinkProps,
  //   },
  //   MuiButtonBase: {
  //     defaultProps: {
  //       LinkComponent: LinkBehavior,
  //     },
  //   },
  // },
});
