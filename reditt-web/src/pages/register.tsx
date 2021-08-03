import React from "react";
import { Form, Formik } from "formik";
import Wrapper from "../components/wrapper";
import { InputField } from "../components/inputfield";
import { useRegisterMutation } from "../generated/graphql";
import { Button } from "@chakra-ui/react";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/withUrqlClient";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const router = useRouter();
  const [,register] = useRegisterMutation();
  return (
    <Wrapper variant="regular">
      <Formik
        initialValues={{ username: "", password: "" ,email : ""}}
        onSubmit={async(values,{setErrors}) => {
          console.log(values);
          const response =  await register(values);
          if(response.data?.register.errors){
            setErrors(toErrorMap(response.data.register.errors));
          }
          
          if(response.data?.register.user){
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="username" label="Username" placeholder="Username" type="text" />
            <InputField name="email" label="Email" placeholder="Email" type="text" />
            <InputField name="password" label="Password" placeholder="Password" type="password" />
            <Button type="submit" isLoading={isSubmitting} colorScheme="teal">Register</Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(Register);
