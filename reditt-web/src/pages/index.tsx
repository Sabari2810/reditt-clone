import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import Updoot from "../components/Updoot";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { createUrqlClient } from "../utils/withUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 10,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({ variables });
  const [, deletePost] = useDeletePostMutation();
  const [{ data: medata, fetching: mefetching }] = useMeQuery({
    pause: isServer(),
  });

  if (!fetching && !data) {
    return <div>Your query to get post failed</div>;
  }

  return (
    <Layout variant="small">
      {!data && fetching ? (
        <div>Loading...</div>
      ) : (
        <Stack spacing={8}>
          {data?.Posts.posts.map((p) => (
            <Flex
              align="center"
              flex={1}
              p={5}
              key={p.id}
              shadow="md"
              borderWidth="1px"
            >
              <Updoot post={p} />
              <Box flex={1}>
                <NextLink href="/post/id" as={`/post/${p.id}`}>
                  <Link>
                    <Heading fontSize="l">{p.title}</Heading>
                  </Link>
                </NextLink>
                <Text>posted by {p.creator.username}</Text>
                <Flex>
                  <Text flex={1} mt={4}>
                    {p.textSnippet}
                  </Text>
                  {medata?.Me?.id && medata.Me.id === p.creatorId ? (
                    <Box ml="auto">
                      <NextLink
                        href="post/update/[id]"
                        as={`post/update/${p.id}`}
                      >
                        <IconButton
                          aria-label="delete post"
                          ml="auto"
                          mr={1}
                          icon={<EditIcon />}
                          as={Link}
                        ></IconButton>
                      </NextLink>
                      <IconButton
                        aria-label="delete post"
                        ml="auto"
                        icon={<DeleteIcon />}
                        onClick={() => {
                          deletePost({
                            id: p.id,
                          });
                        }}
                      ></IconButton>
                    </Box>
                  ) : undefined}
                </Flex>
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

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
