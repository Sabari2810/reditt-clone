import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NavLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutfetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({
    pause : isServer()
  });
  let body = null;

  if (fetching) {
  } else if (data?.Me?.id == null) {
    body = (
      <>
        <NavLink href="/login">
          <Link color="white" mr={4}>
            Login
          </Link>
        </NavLink>
        <NavLink href="/register">
          <Link color="white">Register</Link>
        </NavLink>
      </>
    );
  } else {
    body = (
      <>
        <Box color="white">
          {data.Me.username}
          <Button
            onClick={() => {
              logout();
            }}
            isLoading={logoutfetching}
            ml={4}
            variant="outline"
          >
            Logout
          </Button>
        </Box>
      </>
    );
  }
  return (
    <Flex zIndex={2} position="sticky" top={0} padding={4} bgColor="tan">
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
