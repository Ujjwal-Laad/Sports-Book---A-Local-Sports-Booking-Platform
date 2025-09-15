"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ FIX: Get the callbackUrl from the URL search params, with a default
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.ok) {
        // ✅ FIX: Push to the dynamic callbackUrl
        router.push(callbackUrl);
      } else {
        setError(result?.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
        <div className="hidden md:flex md:w-1/2 bg-primary-600 items-center justify-center">
          <img
            src="/login/banner.jpg"
            alt="Sports banner"
            className="object-cover h-full w-full"
          />
        </div>
        <div className="flex w-full md:w-1/2 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-primary-600">
                  SportsBook
                </h1>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Sign in to your account
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      {...register("email")}
                      type="email"
                      autoComplete="email"
                      className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      {...register("password")}
                      type="password"
                      autoComplete="current-password"
                      className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Enter your password"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                <div className="mt-6 space-y-3 text-center text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link
                      href="/auth/register"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      Sign up
                    </Link>
                  </div>
                  <div>
                    <Link
                      href="#"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
