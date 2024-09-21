"use client";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpFormSchema } from "@/schema";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";
import { signUp } from "aws-amplify/auth";

type FormItem = {
  name: "email" | "username" | "password" | "confirmPassword";
  placeholder: string;
  label: string;
};

const FORM_ITEMS: FormItem[] = [
  {
    name: "email",
    placeholder: "e.g., john.doe@example.com",
    label: "Email",
  },
  {
    name: "username",
    placeholder: "Choose a unique username",
    label: "Username",
  },
  {
    name: "password",
    placeholder:
      "At least 6 characters, with uppercase, lowercase, numbers, and symbols",
    label: "Password",
  },
  {
    name: "confirmPassword",
    placeholder: "Re-enter your password",
    label: "Confirm Password",
  },
];

const SignUpForm: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  const client = generateClient<Schema>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [userSignedUp, setUserSignedUp] = useState(false);

  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const fetchUsers = async () => {
    try {
      const { errors, data: users } = await client.models.User.list({
        selectionSet: ["username"],
        authMode: "apiKey",
      });
      if (errors) {
        throw new Error(errors[0].message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      setLoading(true);
      const { userId } = await signUp({
        username: email,
        password,
      });

      if (userId) {
        const { errors } = await client.models.User.create(
          {
            userId,
            username,
            email,
          },
          {
            authMode: "apiKey",
          }
        );
        if (errors) {
          throw new Error(errors[0].message);
        }
      }

      router.push("/confirm-account");
      toast({
        title: "Confirm Account",
        description:
          "Please confirm your account with the code we've sent your email.",
      });
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof signUpFormSchema>) => {
    try {
      const { errors, data: users } = await client.models.User.list({
        authMode: "apiKey",
        selectionSet: ["username"],
        filter: {
          username: {
            beginsWith: values.username,
          },
        },
      });

      if (errors && errors[0].message) {
        throw new Error(errors[0].message);
      }

      if (users.length > 0) {
        throw new Error("A user with this username already exists");
      }

      await handleSignUp(values.email, values.password, values.username);
      setEmail(values.email);
      setUserSignedUp(true);
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    if (userSignedUp) {
      localStorage.setItem("emailForConfirmation", email);
    }
  }, [userSignedUp]);

  return (
    <Form {...form}>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {FORM_ITEMS.map((formItem, idx) => (
          <FormField
            key={idx}
            control={form.control}
            name={formItem.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formItem.label}</FormLabel>
                <FormControl>
                  <Input placeholder={formItem.placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="buttons flex items-center gap-2">
          <Button
            disabled={loading}
            onClick={onGoBack}
            type="button"
            className="flex-grow"
            variant={"secondary"}
          >
            Go Back
          </Button>
          <Button disabled={loading} className="flex-grow" type="submit">
            Submit
          </Button>
        </div>
      </motion.form>
    </Form>
  );
};

export default SignUpForm;
