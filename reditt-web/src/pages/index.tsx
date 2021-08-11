import {
  Stack,
  Text,
  Heading,
  Box,
  Flex,
  Link,
  Button,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/withUrqlClient";
import NextLink from "next/link";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });

  if (!fetching && !data) {
    return <div>Your query to get post failed</div>;
  }

  return (
    <Layout variant="small">
      <Flex align="center">
        <Heading>Reditt Clone</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">Create Post</Link>
        </NextLink>
      </Flex>
      <br />
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data?.Posts.posts.map((p) => (
            <Box p={5} key={p.id} shadow="md" borderWidth="1px">
              <Heading fontSize="l">{p.title}</Heading>
              <Text mt={4}>{p.textSnippet}</Text>
            </Box>
          ))}
        </Stack>
      )}

      <Flex>
        {data && data.Posts.hasMorePost ? (
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data?.Posts.posts[data.Posts.posts.length - 1]
                  .createdAt as string,
              });
            }}
            m="auto"
            my="8"
          >
            Load More...
          </Button>
        ) : (
          <Box m="auto" my="8">"Your'e done mate..."</Box>
        )}
      </Flex>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
