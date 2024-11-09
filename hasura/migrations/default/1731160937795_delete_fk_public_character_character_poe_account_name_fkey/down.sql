alter table "public"."character"
  add constraint "character_poe_account_name_fkey"
  foreign key ("poe_account_name")
  references "public"."user"
  ("poe_name") on update no action on delete no action;
