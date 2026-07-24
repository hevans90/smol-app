SET check_function_bodies = false;
INSERT INTO public.item_order_type (value) VALUES ('unique') ON CONFLICT DO NOTHING;
INSERT INTO public.item_order_type (value) VALUES ('other') ON CONFLICT DO NOTHING;
INSERT INTO public.item_order_type (value) VALUES ('base') ON CONFLICT DO NOTHING;
INSERT INTO public.item_order_type (value) VALUES ('gem') ON CONFLICT DO NOTHING;
