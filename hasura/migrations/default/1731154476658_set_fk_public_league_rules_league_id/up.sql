alter table "public"."league_rules"
  add constraint "league_rules_league_id_fkey"
  foreign key ("league_id")
  references "public"."league"
  ("id") on update restrict on delete cascade;
