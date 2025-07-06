import React, { useEffect, useState } from "react";
import * as z from "zod";
import useStore from "../../store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/UI/Card";
import { SocialAuth } from "../../components/UI/socialauth";
import { Separator } from "../../components/UI/separator";
import Input from "../../components/UI/input";
import { Button } from "../../components/UI/button";
import { BiLoader } from "react-icons/bi";
import { toast } from "sonner";
import api from "../../Firebase/apiCall";

const LoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .email({ message: "Invalid email address" }),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required."),
});

const SignIn = () => {
  const { user, setCredentials } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { data: res } = await api.post("/auth/login", data);
      if (res?.user) {
        toast.success(res?.message);
        const userInfo = { ...res?.user, token: res.token };
        localStorage.setItem("user", JSON.stringify(userInfo));
        setCredentials(userInfo);
        setTimeout(() => {
          navigate("/overview");
        }, 1500);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    user && navigate("/");
  }, [user]);
  return (
    <div className="w-full h-screen flex items-center justify-center bg-cover bg-center relative">
      <Card
        className={
          "w-[400px] bg-white dark:bg-black/20 shadow-md overflow-hidden"
        }
      >
        <div className="p-6 md:-8">
          <CardHeader className="py-0">
            <CardTitle className="mb-8 text-center dark:text-white">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className={"p-0"}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="mb-8 space-y-6">
                <SocialAuth isLoading={loading} setLoading={setLoading} />
                <Separator />
                <Input
                  disabled={loading}
                  id="email"
                  label="Email"
                  name="email"
                  register={register}
                  type="email"
                  placeholder="John.smith@gmail.com"
                  error={errors?.email?.message}
                  {...register("email")}
                  className="text-sm border dark:border-gray-800 dark:bg-transparent dark:placeholder:text-gray-700 dark:text-gray-300 dark:outline-none"
                />
                <Input
                  disabled={loading}
                  id="password"
                  label="Password"
                  name="password"
                  register={register}
                  type="password"
                  placeholder="Min six letters"
                  error={errors?.password?.message}
                  {...register("password")}
                  className="text-sm border dark:border-gray-800 dark:bg-transparent dark:placeholder:text-gray-700 dark:text-gray-300 dark:outline-none"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-violet-800 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <BiLoader className="text-2x1 text-white animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </div>
        <CardFooter className="justify-center gap-2">
          <p className="text-sm text-gray-600"> New here? Create an account</p>
          <Link
            to="/sign-up"
            className="text-sm font-semibold text-violet-600 hover:underline"
          >
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
