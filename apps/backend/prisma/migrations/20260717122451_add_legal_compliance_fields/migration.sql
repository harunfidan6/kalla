-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kvkk_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kvkk_accepted_at" TIMESTAMP(3),
ADD COLUMN     "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketing_opt_in_at" TIMESTAMP(3);
