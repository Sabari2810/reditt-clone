import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
import React from "react";
import NavLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutfetching }, logout] = useLogoutMutation();
  const router = useRouter();
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
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
          <NavLink href="/create-post">
            <Button as={Link} mr={4}>
              <Link color="black">Create Post</Link>
            </Button>
          </NavLink>
          {data.Me.username}
          <Button
            onClick={async () => {
              await logout();
              router.reload();
            }}
            isLoading={logoutfetching}
            ml={4}
            variant="link"
          >
            Logout
          </Button>
        </Box>
      </>
    );
  }
  return (
    <Flex zIndex={2} position="sticky" top={0} padding={4} bgColor="tan">
      <Flex flex={1} maxW={800} margin="auto">
        <NavLink href="/">
          <Link>
            <Heading>Reditt Clone</Heading>
          </Link>
        </NavLink>
        <Box ml="auto">{body}</Box>
      </Flex>
    </Flex>
  );
};
