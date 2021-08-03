import { Flex, Link, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import router from "next/router";
import React from "react";
import { useState } from "react";
import { InputField } from "../components/inputfield";
import Wrapper from "../components/wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { createUrqlClient } from "../utils/withUrqlClient";
import login from "./login";

const ForgotPassword: React.FC<{}> = ({}) => {
    const [,forgotPassword] = useForgotPasswordMutation();
     const[iscomplete,setComplete] = useState(false); 
    return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ email:'' }}
        onSubmit={async (values,) => {
          const response = await forgotPassword(values);
          if(response){
             setComplete(true);
          }
          
        }}
      >
        {({ isSubmitting }) => iscomplete ? "if an account with that email exists, we sent you a mail to reset password" :(
          <Form>
            <InputField
              name="email"
              label="Email"
              placeholder="email"
              type="email"
            />
            <Button type="submit" isLoading={isSubmitting} colorScheme="teal">
              Forgot Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
