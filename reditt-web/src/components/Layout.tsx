import React from "react";
import { NavBar } from "./NavBar";
import Wrapper, { VariantType } from "./wrapper";

interface LayoutProps {
  variant: VariantType;
}

export const Layout: React.FC<LayoutProps> = ({ children }, props) => {
  return (
    <>
      <NavBar />
      <Wrapper variant={props.variant}>{children}</Wrapper>
    </>
  );
};
