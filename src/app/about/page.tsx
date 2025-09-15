"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    name: "Real-time Booking",
    description: "Instant booking confirmation with live availability updates",
    icon: ClockIcon,
  },
  {
    name: "Secure Payments",
    description: "Safe and secure payment processing with multiple payment options",
    icon: CreditCardIcon,
  },
  {
    name: "Multi-sport Platform",
    description: "Book venues for badminton, tennis, football, cricket, and more",
    icon: GlobeAltIcon,
  },
  {
    name: "Mobile Friendly",
    description: "Fully responsive design that works perfectly on all devices",
    icon: DevicePhoneMobileIcon,
  },
  {
    name: "Community Building",
    description: "Connect with fellow players and build your sports community",
    icon: UserGroupIcon,
  },
  {
    name: "Trust & Safety",
    description: "Verified venues and secure transactions for peace of mind",
    icon: ShieldCheckIcon,
  },
];

const stats = [
  { id: 1, name: "Active Users", value: "10,000+" },
  { id: 2, name: "Partner Venues", value: "500+" },
  { id: 3, name: "Cities Covered", value: "25+" },
  { id: 4, name: "Bookings Completed", value: "50,000+" },
];

const team = [
  {
    name: "Rajesh Kumar",
    role: "Founder & CEO",
    bio: "Former sports enthusiast with 10+ years in tech, passionate about making sports accessible to everyone.",
    image: "/team/ceo.jpg",
  },
  {
    name: "Priya Sharma",
    role: "CTO",
    bio: "Tech veteran with expertise in scalable systems and real-time applications.",
    image: "/team/cto.jpg",
  },
  {
    name: "Amit Patel",
    role: "Head of Operations",
    bio: "Sports facility management expert ensuring quality partnerships and service delivery.",
    image: "/team/head-ops.jpg",
  },
  {
    name: "Sarah Johnson",
    role: "Product Manager",
    bio: "User experience advocate focused on creating intuitive and delightful booking experiences.",
    image: "/team/pm.jpg",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-green-600 via-green-700 to-green-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            About SportsBook
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed"
          >
            We're revolutionizing how people discover, book, and enjoy sports facilities across India.
            Your next game is just a click away.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To make sports accessible to everyone by connecting players with quality facilities 
                through a seamless, technology-driven platform. We believe that everyone deserves 
                easy access to great sports experiences.
              </p>
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                <span className="font-semibold">Democratizing Sports Access</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To become India's leading sports facility booking platform, fostering vibrant 
                sporting communities and making every neighborhood a hub for active, healthy lifestyles.
              </p>
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                <span className="font-semibold">Building Sporting Communities</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Numbers that showcase our growing community and the trust placed in our platform
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SportsBook?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built features that matter to both players and facility owners
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <feature.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="ml-3 text-xl font-semibold text-gray-900">
                    {feature.name}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Passionate individuals working together to make sports more accessible
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-xl text-center hover:shadow-md transition-shadow"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-green-600 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

     
    </div>
  );
}
