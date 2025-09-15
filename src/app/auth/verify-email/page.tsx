"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push("/auth/login");
    }
  }, [email, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError("");
        setIsVerified(true);
        setMessage(data.message);
        setTimeout(() => {
          router.push("/auth/login?verified=true");
        }, 2000);
      } else {
        setMessage("");
        setError(data.error || "An unknown error occurred.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP sent successfully!");
        setCountdown(60); // 60 second cooldown
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            {isVerified ? (
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            ) : (
              <EnvelopeIcon className="h-8 w-8 text-primary-600" />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isVerified ? "Email Verified!" : "Verify Your Email"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isVerified
              ? "Your email has been successfully verified. Redirecting to login..."
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {!isVerified && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label htmlFor="otp" className="sr-only">
                OTP Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl font-mono tracking-widest text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-700">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-primary-600 px-4 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || countdown > 0}
                className="text-primary-600 hover:text-primary-500 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending
                  ? "Sending..."
                  : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend OTP"}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {isVerified && (
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Continue to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
