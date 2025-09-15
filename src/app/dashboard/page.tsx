 "use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@/generated/prisma";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Redirect based on user role
    switch (session.user.role) {
      case Role.USER:
        router.push("/");
        break;
      case Role.OWNER:
        router.push("/owner/dashboard");
        break;
      case Role.ADMIN:
        router.push("/admin/dashboard");
        break;
      default:
        router.push("/");
        break;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Redirecting...</h1>
        <p className="text-gray-600 mt-2">Please wait while we direct you to your dashboard.</p>
      </div>
    </div>
  );
}
