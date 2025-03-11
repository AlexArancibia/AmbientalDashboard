/*
  Warnings:

  - You are about to drop the column `total` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `ServiceOrderItem` table. All the data in the column will be lost.
  - Added the required column `code` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ServiceOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "total",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ServiceOrderItem" DROP COLUMN "total",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "days" INTEGER,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
