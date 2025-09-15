import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { Role } from "@/generated/prisma";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.emailOtp.findFirst({
      where: {
        email,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (!otpRecord) {
      return NextResponse.json(
        { error: "No valid OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.emailOtp.delete({
        where: { id: otpRecord.id },
      });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 3) {
      await prisma.emailOtp.delete({
        where: { id: otpRecord.id },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 400 }
      );
    }

    const isValid = await compare(otp, otpRecord.tokenHash);

    if (!isValid) {
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: {
          attempts: otpRecord.attempts + 1,
        },
      });

      const attemptsLeft = 3 - (otpRecord.attempts + 1);
      return NextResponse.json(
        { error: `Invalid OTP. ${attemptsLeft} attempts remaining.` },
        { status: 400 }
      );
    }

    // Parse the stored user data from metadata
    let userData;
    try {
      userData = JSON.parse((otpRecord.metadata as string) || "{}");
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid registration data. Please start registration again.",
        },
        { status: 400 }
      );
    }

    if (!userData.email || !userData.passwordHash) {
      return NextResponse.json(
        {
          error:
            "Incomplete registration data. Please start registration again.",
        },
        { status: 400 }
      );
    }

    // Create the user and clean up OTP in a single transaction
    await prisma.$transaction(async (tx) => {
      // Create the user with verified email
      const newUser = await tx.user.create({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          fullName: userData.fullName,
          role: userData.role,
          emailVerified: true, // User is verified since they confirmed OTP
        },
      });

      // If role is OWNER, create the FacilityOwner profile
      if (userData.role === Role.OWNER) {
        await tx.facilityOwner.create({
          data: {
            userId: newUser.id,
          },
        });
      }

      // Delete all OTPs for this email (no need to keep them after successful verification)
      await tx.emailOtp.deleteMany({
        where: { email: userData.email },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email verified and account created successfully!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
