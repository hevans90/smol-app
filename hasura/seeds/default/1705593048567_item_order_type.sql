SET check_function_bodies = false;
INSERT INTO public.item_order_type (value) VALUES ('unique') ON CONFLICT DO NOTHING;
INSERT INTO public.item_order_type (value) VALUES ('other') ON CONFLICT DO NOTHING;
INSERT INTO public.item_order_type (value) VALUES ('transfiguredgem') ON CONFLICT DO NOTHING;
