import { Box, Heading } from "@chakra-ui/react";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { Layout } from "../../components/Layout";
import { usePostQuery, usePostsQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/withUrqlClient";

const Post: NextPage = () => {
  const { query } = useRouter();
  const pid = typeof query.id === "string" ? parseInt(query.id) : -1;
  const [{ data }] = usePostQuery({
    pause: pid === -1,
    variables: {
      id: pid,
    },
  });

  if (!data?.Post) {
    return <Box>Request failed</Box>;
  }
  return (
    <Layout variant="small">
      <Heading mb={5}>{data.Post.title}</Heading>
      <div>{data.Post.text}</div>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
