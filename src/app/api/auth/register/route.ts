import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { sendMail } from "@/lib/mailer";
import { Role } from "@/generated/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

interface PendingUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
}

// It's best practice to use a shared Zod schema
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([Role.USER, Role.OWNER]).optional().default(Role.USER),
});

// Helper to create OTP for pending registration
async function createPendingRegistrationOtp(email: string, userData: PendingUserData) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
  const tokenHash = await bcrypt.hash(otp, 10);

  // Clean up any existing OTPs for this email first
  await prisma.emailOtp.deleteMany({
    where: { email }
  });

  // Store the pending user data along with the OTP
  await prisma.emailOtp.create({
    data: {
      email,
      tokenHash,
      expiresAt,
      // Store user registration data as JSON to create user after verification
      metadata: JSON.stringify(userData)
    },
  });

  return otp;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = signupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, fullName, role } = validated.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Store pending registration data and create OTP (no user created yet)
    const pendingUserData = {
      email,
      passwordHash,
      fullName,
      role
    };

    const otp = await createPendingRegistrationOtp(email, pendingUserData);

    // Send email outside of transaction to prevent timeout
    try {
      await sendMail(
        email,
        "Your SportsBook Verification Code",
        `<p>Your verification code is: <b>${otp}</b></p><p>It is valid for 5 minutes.</p>`
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the registration if email fails
      // User can request OTP resend via /api/auth/send-otp
    }

    return NextResponse.json(
      { ok: true, message: "Please verify your email. OTP sent to your email address." },
      { status: 200 }
    );
  } catch (err) {
    console.log(err,"---------------")
    console.error("Registration failed:", err);
    return NextResponse.json(
      { error: "Could not complete registration." },
      { status: 500 }
    );
  }
}
