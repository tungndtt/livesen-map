export type Season = {
  intercrop?: boolean;
  soil_type?: string;
  variety?: string;
  seed_density?: number;
  yield?: number;
  max_allowed_fertilizer?: number;
  first_fertilizer_amount?: number;
  second_fertilizer_amount?: number;
  recommended_fertilizer_amount?: number;
  first_soil_tillage?: string;
  second_soil_tillage?: string;
  first_crop_protection?: string;
  second_crop_protection?: string;
  nitrate?: number;
  phosphor?: number;
  potassium?: number;
  ph?: number;
};

export type SeasonField = 
  | "intercrop"
  | "soil_type" 
  | "variety" 
  | "seed_density" 
  | "yield" 
  | "max_allowed_fertilizer" 
  | "first_fertilizer_amount" 
  | "second_fertilizer_amount" 
  | "recommended_fertilizer_amount" 
  | "first_soil_tillage" 
  | "second_soil_tillage" 
  | "first_crop_protection" 
  | "second_crop_protection" 
  | "nitrate" 
  | "phosphor" 
  | "potassium" 
  | "ph";