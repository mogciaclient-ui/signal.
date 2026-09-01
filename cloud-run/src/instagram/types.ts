export type InstagramAccount = {
  id: string;
  user_id?: string;
  username: string;
  account_type?: "BUSINESS" | "CREATOR";
  media_count?: number;
};
export type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
};
export type InstagramMedia = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS";
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  permalink?: string;
  timestamp: string;
};
export type InsightValue = { value?: number | string; end_time?: string };
export type InsightMetric = {
  name: string;
  period?: string;
  values?: InsightValue[];
  total_value?: { value?: number | string };
};
export type ApiList<T> = {
  data: T[];
  paging?: { cursors?: { after?: string }; next?: string };
};
