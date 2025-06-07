export type DDSItem = {
  id: string;
  inventory_height: number;
  inventory_width: number;
  is_alternate_art: boolean;
  item_class: string;
  name: string;
  visual_identity: {
    dds_file: string;
    id: string;
  };
  renamed_version: string | null;
  base_version: string | null;
};
