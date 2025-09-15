"use client";

import Link from "next/link";
import {
  StarIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable"; // RE-INTRODUCED: Swiper functionality
import { motion, AnimatePresence } from "framer-motion";

// RE-INTRODUCED: The data for the banner carousel
const banners = [
  {
    title: "Kick Off Your Game",
    subtitle: "Football, Cricket, Badminton, Tennis — all in one place.",
    image: "/home/banner/football.jpg", // Make sure you have these images
    cta: { label: "Book a Venue", href: "/venues" },
  },
  {
    title: "Play Anytime, Anywhere",
    subtitle: "Instant booking with real-time availability.",
    image: "/home/banner/badminton.jpg",
    cta: { label: "Explore Sports", href: "/venues" },
  },
  {
    title: "Join Local Communities",
    subtitle: "Meet other players, join matches, and grow together.",
    image: "/home/banner/basketball.jpg",
    cta: { label: "Join Now", href: "/auth/register" },
  },
];

// Interfaces for API data
interface FeaturedVenue {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  sports: string[];
  minPricePerHour: number;
  currency: string;
  amenities: string[];
  image?: string; // Add image field
  tags: string[];
}

interface PopularSport {
  name: string;
  image: string;
}

// Static popular sports data
const popularSports: PopularSport[] = [
  { name: "Badminton", image: "/sports-images/badminton.jpg" },
  { name: "Football", image: "/sports-images/football.jpg" },
  { name: "Cricket", image: "/sports-images/cricket.jpg" },
  { name: "Tennis", image: "/sports-images/tennis.jpg" },
  { name: "Basketball", image: "/sports-images/basketball.jpg" },
  { name: "Table Tennis", image: "/sports-images/table-tennis.jpg" },
  { name: "Volleyball", image: "/sports-images/volleyball.jpg" },
  { name: "Squash", image: "/sports-images/squash.jpg" },
];

export default function Home() {
  // State for carousel and data
  const [activeBanner, setActiveBanner] = useState(0);
  const [featuredVenues, setFeaturedVenues] = useState<FeaturedVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const nextBanner = () =>
    setActiveBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () =>
    setActiveBanner((prev) => (prev - 1 + banners.length) % banners.length);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const venuesResponse = await fetch("/api/venues/featured");

        if (venuesResponse.ok) {
          const venuesData = await venuesResponse.json();
          setFeaturedVenues(venuesData);
        } else {
          console.error("Failed to fetch venues:", venuesResponse.status);
        }
      } catch (error) {
        console.error("Failed to fetch featured venues:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Autoplay every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextBanner, 5000);
    return () => clearInterval(timer);
  }, []);

  // RE-INTRODUCED: Swipe handlers for mobile and desktop
  const handlers = useSwipeable({
    onSwipedLeft: nextBanner,
    onSwipedRight: prevBanner,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Logic for the venue scroller (no changes)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Logic for the sports scroller
  const sportsScrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollSports = (direction: "left" | "right") => {
    if (sportsScrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      sportsScrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-white text-gray-900">
      {/* --- 1. Hero Section (RESTORED to Swiper) --- */}
      <section
        className="relative h-[90vh] text-white overflow-hidden"
        {...handlers}
      >
        <AnimatePresence>
          <motion.div
            key={activeBanner}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banners[activeBanner].image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full flex flex-col justify-center items-center text-center px-4 z-10">
          <motion.h1
            key={`${activeBanner}-title`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold drop-shadow-xl mb-4"
          >
            {banners[activeBanner].title}
          </motion.h1>
          <motion.p
            key={`${activeBanner}-subtitle`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl"
          >
            {banners[activeBanner].subtitle}
          </motion.p>
          <motion.div
            key={`${activeBanner}-cta`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link
              href={banners[activeBanner].cta.href}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg tracking-wide uppercase transition-transform hover:scale-105 shadow-lg"
            >
              {banners[activeBanner].cta.label}
            </Link>
          </motion.div>
        </div>

        {/* Carousel progress dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveBanner(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                activeBanner === i
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </section>

      {/* --- 2. Book Venues Section (No Changes) --- */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Book Venues</h2>
            <Link
              href="/venues"
              className="text-green-600 font-semibold hover:text-green-500 transition"
            >
              See all venues &gt;
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition hidden md:block"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition hidden md:block"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div
              ref={scrollContainerRef}
              className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
            >
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[280px] bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-40 bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : featuredVenues.length > 0 ? (
                featuredVenues.map((venue) => (
                  <Link
                    key={venue.id}
                    href={`/venues/${venue.id}`}
                    className="flex-shrink-0 w-[280px] bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="relative w-full h-40 bg-gray-200 rounded-t-lg overflow-hidden">
                      {venue.image ? (
                        <img
                          src={venue.image}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                          <BuildingOfficeIcon className="w-16 h-16 text-primary-600" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">
                        {venue.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <StarIcon className="w-5 h-5 text-yellow-500 mr-1" />
                        <span className="font-semibold text-gray-800">
                          {venue.rating > 0 ? venue.rating.toFixed(1) : "New"}
                        </span>
                        <span className="ml-1">({venue.reviewCount})</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPinIcon className="w-5 h-5 mr-1" />
                        <span className="line-clamp-1">
                          {venue.city}, {venue.state}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-green-600 mb-3">
                        From ₹{Math.round(venue.minPricePerHour)}/hour
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {venue.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                // No venues message
                <div className="flex-shrink-0 w-full text-center py-12">
                  <p className="text-gray-500">No venues available yet.</p>
                  <Link
                    href="/auth/register?role=OWNER"
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Be the first to add your venue!
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. Popular Sports Section (Updated to Slider) --- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Popular Sports</h2>
            <Link
              href="/venues"
              className="text-green-600 font-semibold hover:text-green-500 transition"
            >
              See all sports &gt;
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollSports("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition hidden md:block"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => scrollSports("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition hidden md:block"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div
              ref={sportsScrollContainerRef}
              className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
            >
              {popularSports.map((sport) => (
                <Link
                  key={sport.name}
                  href={`/venues?sport=${sport.name.toLowerCase()}`}
                  className="flex-shrink-0 w-[200px] group text-center transform hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-shadow">
                    <img
                      src={sport.image}
                      alt={sport.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-semibold text-lg">{sport.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
