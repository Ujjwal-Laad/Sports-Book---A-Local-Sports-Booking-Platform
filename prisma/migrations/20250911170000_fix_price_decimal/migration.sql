-- Fix pricePerHour to use proper DECIMAL type for rupees
ALTER TABLE "public"."Court" ALTER COLUMN "pricePerHour" SET DATA TYPE DECIMAL(10, 2);