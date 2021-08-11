import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";

type fieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: String;
  placeholder: String;
  label : String;
  type : String;
  textarea ?:boolean
};

export const InputField: React.FC<fieldProps> = (props) => {
  const [field, { error }] = useField(props);
  return (
    <FormControl marginBottom="20px" isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
      {!props.textarea ? <Input {...field} type={props.type} placeholder={props.placeholder} id={field.name} /> : <Textarea {...field} type={props.type} placeholder={props.placeholder} id={field.name} /> }
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
