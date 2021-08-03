import React from "react";
import { Form, Formik } from "formik";
import Wrapper from "../components/wrapper";
import { InputField } from "../components/inputfield";
import { useLoginMutation } from "../generated/graphql";
import { Button, Flex, Link } from "@chakra-ui/react";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/withUrqlClient";
import NextLink from 'next/link';


const Login = ({}) => {
  const router = useRouter();
  const [, login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameoremail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          console.log(values);
          const response = await login(values);
          if (response.data?.Login.errors) {
            setErrors(toErrorMap(response.data.Login.errors));
          }

          if (response.data?.Login.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameoremail"
              label="Username"
              placeholder="Username"
              type="text"
            />
            <InputField
              name="password"
              label="Password"
              placeholder="Password"
              type="password"
            />
            <Flex>
              <NextLink href='/forgot-password'>
                <Link ml={"auto"}>
                  forgot password?
                </Link>
              </NextLink>
            </Flex>
            <Button type="submit" isLoading={isSubmitting} colorScheme="teal">
              Login
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Login);
