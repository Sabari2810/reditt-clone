import { Box, Button } from "@chakra-ui/react";
import { query } from "@urql/exchange-graphcache";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../../../components/inputfield";
import { Layout } from "../../../components/Layout";
import {
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/withUrqlClient";

const UpdatePost: NextPage = () => {
  const router = useRouter();
  const [, updatePost] = useUpdatePostMutation();
  const pid =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

  const [{ data }] = usePostQuery({
    pause: pid === -1,
    variables: {
      id: pid,
    },
  });

  if (!data) {
    return <Box>Request Failed</Box>;
  }

  return (
    <Layout variant="regular">
      <Formik
        initialValues={{ title: data.Post.title, text: data.Post.text }}
        onSubmit={async (values) => {
          const res = await updatePost({
            id: pid,
            title: values.title,
            text: values.text,
          });

          if (res) {
            router.back();
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="title"
              label="Title"
              placeholder="title"
              type="text"
            />
            <InputField
              name="text"
              label="Body"
              placeholder="Body..."
              type="text"
              textarea={true}
            />
            <Button type="submit" isLoading={isSubmitting} colorScheme="teal">
              Update Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(UpdatePost);
