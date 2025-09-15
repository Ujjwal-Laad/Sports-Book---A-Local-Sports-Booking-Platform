"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";


const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["USER", "OWNER"] as const).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function RegisterForm() {
  const [step,setStep] = useState<"register" | "otp">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: otpField,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Registration submit
  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.ok) {
        setUserEmail(data.email);
        setStep("otp");
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP submit
  const onOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp: data.otp }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        router.push("/auth/login?verified=true");
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Step UI
  if (step === "otp") {
    return (
      <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">
        {/* Left image */}
        <div className="hidden md:flex md:w-1/2 h-full bg-primary-600 items-center justify-center">
          <img
            src="/login/banner.jpg"
            alt="Sports banner"
            className="object-cover h-full w-full"
          />
        </div>

        {/* OTP form */}
        <div className="flex w-full md:w-1/2 h-full items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-primary-600">
                  SportsBook
                </h1>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  Verify your email
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  We sent an OTP to {userEmail}
                </p>
              </div>

            <form
              className="mt-8 space-y-6"
              onSubmit={handleOtpSubmit(onOtpSubmit)}
            >
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter 6-digit OTP <span className="text-red-500">*</span>
                </label>
                <input
                  id="otp"
                  {...otpField("otp")}
                  type="text"
                  maxLength={6}
                  className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="123456"
                />
                {otpErrors.otp && (
                  <p className="mt-1 text-sm text-red-600">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Step UI
  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left image */}
      <div className="hidden md:flex md:w-1/2 h-full bg-primary-600 items-center justify-center">
        <img
          src="/login/banner.jpg"
          alt="Sports banner"
          className="object-cover h-full w-full"
        />
      </div>

      {/* Registration form */}
      <div className="flex w-full md:w-1/2 h-full items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary-600">
                SportsBook
              </h1>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-gray-600">Sign up to get started</p>
            </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmit(onRegisterSubmit)}
          >
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  {...registerField("fullName")}
                  type="text"
                  placeholder="Your full name"
                  className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  {...registerField("email")}
                  type="email"
                  placeholder="your@email.com"
                  className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  {...registerField("role")}
                  className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="USER">User</option>
                  <option value="OWNER">Facility Owner</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  {...registerField("password")}
                  type="password"
                  placeholder="Password"
                  className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  {...registerField("confirmPassword")}
                  type="password"
                  placeholder="Confirm password"
                  className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
