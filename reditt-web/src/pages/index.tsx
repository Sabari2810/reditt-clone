import {
  Box, Button, Flex, Heading, Link, Stack,
  Text
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import Updoot from "../components/Updoot";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/withUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: "" as null | string,
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
            <Flex p={5} key={p.id} shadow="md" borderWidth="1px">
              <Updoot post={p} />
              <Box>
                <Heading fontSize="l">{p.title}</Heading>
                <Text>posted by {p.creator.username}</Text>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>
            </Flex>
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
          <Box m="auto" my="8">
            "Your'e done mate..."
          </Box>
        )}
      </Flex>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(Index);
