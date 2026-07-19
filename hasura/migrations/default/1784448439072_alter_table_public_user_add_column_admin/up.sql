ALTER TABLE "public"."user" ADD COLUMN "admin" boolean NOT NULL DEFAULT false;

-- bootstrap: the users previously hardcoded as devs in netlify/functions/verify.ts
-- (poe_name may or may not carry the #1234 discriminator depending on when
-- the row was created, so match the bare name)
UPDATE "public"."user" SET "admin" = true
WHERE split_part("poe_name", '#', 1) IN ('Hevans9000', 'Eplyratata', 'Thanangard');
