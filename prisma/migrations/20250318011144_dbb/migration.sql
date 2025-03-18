/*
  Warnings:

  - Added the required column `type` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('CLIENT', 'PROVIDER');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "type" "CompanyType" NOT NULL;
