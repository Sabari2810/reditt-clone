import { Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { validate } from "graphql";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { InputField } from "../components/inputfield";
import { Layout } from "../components/Layout";
import { useCreatePostMutation, useMeQuery } from "../generated/graphql";
import { useIsAuth } from "../utils/useIsAuth";
import { createUrqlClient } from "../utils/withUrqlClient";

const CreatePost: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [, createPost] = useCreatePostMutation();

  useIsAuth("create-post");

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          console.log(values);
          const { error } = await createPost({ options: values });
          if (!error) {
            router.push("/");
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
              Create Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
