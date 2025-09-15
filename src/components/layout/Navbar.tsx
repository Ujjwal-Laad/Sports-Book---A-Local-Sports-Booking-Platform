"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Role } from "@/generated/prisma"; // Assuming this is your generated Prisma type path
import { motion, AnimatePresence } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  InformationCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import React from "react";

const publicNavLinks = [
  { name: "Venues", href: "/venues" },
  { name: "About Us", href: "/about" },
  { name: "Contact Us", href: "/contact" },
];

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = () => signOut({ callbackUrl: "/auth/login" });

  const getNavigationItems = () => {
    if (!session) return [];
    switch (session.user.role) {
      case Role.USER:
        return [
          { name: "My Bookings", href: "/bookings", icon: CalendarDaysIcon },
          { name: "Browse Venues", href: "/venues", icon: BuildingOfficeIcon },
        ];
      case Role.OWNER:
        return [
          { name: "Dashboard", href: "/owner/dashboard", icon: CogIcon },
          {
            name: "My Venues",
            href: "/owner/venues",
            icon: BuildingOfficeIcon,
          },
        ];
      case Role.ADMIN:
        return [
          { name: "Admin Dashboard", href: "/admin/dashboard", icon: CogIcon },
          {
            name: "User Management",
            href: "/admin/users",
            icon: UserCircleIcon,
          },
        ];
      default:
        return [];
    }
  };

  const profileNavigationItems = getNavigationItems();

  if (status === "loading") {
    return (
      <header className="sticky top-0 z-50 bg-white shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-gray-900"
            >
              SPORTS BOOK
            </Link>
          </div>

          {/* Center: Public Links (Desktop) */}
          <div className="hidden sm:flex sm:gap-x-6">
            {publicNavLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side: Auth / Profile */}
          <div className="flex items-center">
            <div className="hidden sm:block">
              {session ? (
                // Profile Dropdown (Desktop)
                <div className="relative ml-4">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open user menu</span>
                    {session.user.avatarUrl ? (
                      <img
                        className="h-9 w-9 rounded-full"
                        src={session.user.avatarUrl}
                        alt=""
                      />
                    ) : (
                      <UserCircleIcon className="h-9 w-9 text-gray-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      >
                        <div className="py-1">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200/80 rounded-t-xl">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {session.user.fullName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {session.user.email}
                            </p>
                          </div>
                          <div className="py-2">
                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600 transition-colors"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <UserCircleIcon className="w-5 h-5 mr-3 text-gray-400" />
                              My Profile
                            </Link>
                            {profileNavigationItems.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600 transition-colors"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <item.icon className="w-5 h-5 mr-3 text-gray-400" />
                                {item.name}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-gray-200/80">
                            <button
                              onClick={handleSignOut}
                              className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Login / Sign up
                </Link>
              )}
            </div>
            {/* Hamburger Menu Button */}
            <div className="ml-2 sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {session ? (
              <>
                {profileNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <item.icon className="w-5 h-5 mr-3 text-gray-500" />
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Login / Sign up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
