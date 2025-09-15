import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendMail } from "@/lib/mailer";
import { Prisma } from "@/generated/prisma";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // If user exists and is already verified, no need to send OTP
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Check for pending registration in EmailOtp
    const pendingOtp = await prisma.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    // If no user and no pending registration, user needs to register first
    if (!existingUser && (!pendingOtp || !pendingOtp.metadata)) {
      return NextResponse.json(
        { error: "Please complete registration first" },
        { status: 404 }
      );
    }

    // Generate OTP and hash it
    const otp = generateOTP();
    const hashedOtp = await hash(otp, 12);

    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing OTP for this email
    await prisma.emailOtp.deleteMany({
      where: { email },
    });

    // Create new OTP record, preserving metadata if it exists (for pending registrations)
    await prisma.emailOtp.create({
      data: {
        email,
        tokenHash: hashedOtp,
        expiresAt,
        attempts: 0,
        verified: false,
        metadata: pendingOtp?.metadata ?? undefined, // ✅ safe for undefined
      },
    });

    // Send OTP via email using the centralized mailer
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #16a34a; text-align: center;">SportsBook Email Verification</h2>
        <p>Hi ${existingUser?.fullName || "there"},</p>
        <p>Your OTP for email verification is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <br>
        <p>Best regards,<br>SportsBook Team</p>
      </div>
    `;

    await sendMail(email, "SportsBook - Email Verification OTP", emailHtml);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
