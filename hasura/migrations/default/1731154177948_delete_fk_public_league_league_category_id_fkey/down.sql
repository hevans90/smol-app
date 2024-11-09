alter table "public"."league"
  add constraint "league_category_id_fkey"
  foreign key ("category_id")
  references "public"."league_category"
  ("id") on update no action on delete set null;
