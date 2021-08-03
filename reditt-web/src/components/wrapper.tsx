import { Box } from "@chakra-ui/react";
import React from "react";

interface wrapperProps {
  variant?: "regular" | "small";
}

const Wrapper: React.FC<wrapperProps> = ({ variant = "regular" ,children}) => {
  return (
  <Box mt={8} mx="auto" w="100%" maxW={variant === "regular" ? "800px" : "400px"}>
      {children}
  </Box>
  );
};

export default Wrapper;
