type FertilizerApplication = {
  fertilizer?: string;
  type?: string;
  amount?: number;
  nitrogen?: number;
  date?: Date;
  stadium?: number;
};

function parseFertilizerApplication(fertilizerApplication: any) {
  const { fertilizer, type, amount, nitrogen, date, stadium } = fertilizerApplication;
  return { fertilizer, type, amount, nitrogen, date: date? new Date(date) : undefined, stadium } as FertilizerApplication;
}

type SoilTillageApplication = {
  type?: string;
  date?: Date;
};

function parseSoilTillageApplication(soilTillageApplication: any) {
  const { type, date} = soilTillageApplication;
  return { type, date: date? new Date(date) : undefined} as SoilTillageApplication;
}

type CropProtectionApplication = {
  amount?: string;
  type?: string;
  date?: Date;
};

function parseCropProtectionApplication(cropProtectionApplication: any) {
  const {amount, type, date} = cropProtectionApplication;
  return {amount, type, date: date? new Date(date) : undefined} as CropProtectionApplication;
}

export type Season = {
  maincrop?: string;
  intercrop?: string;
  soilType?: string;
  variety?: string;
  seedDensity?: number;
  seedDate?: Date;
  maxAllowedFertilizer?: number;
  fertilizerApplications?: FertilizerApplication[];
  soilTillageApplications?: SoilTillageApplication[];
  cropProtectionApplications?: CropProtectionApplication[];
  nitrate?: number;
  phosphor?: number;
  potassium?: number;
  rks?: number;
  ph?: number;
  harvestDate?: Date;
  harvestWeight?: number;
  fallingNumber?: number;
  moisture?: number;
  proteinContent?: number;
};

export type SeasonField = 
  | "maincrop"
  | "intercrop"
  | "soilType" 
  | "variety" 
  | "seedDensity" 
  | "seedDate" 
  | "fertilizerApplications" 
  | "soilTillageApplications" 
  | "cropProtectionApplications"
  | "nitrate" 
  | "phosphor" 
  | "potassium" 
  | "rks"
  | "ph"
  | "maxAllowedFertilizer" 
  | "harvestDate"
  | "harvestWeight"
  | "fallingNumber"
  | "moisture"
  | "proteinContent";

export function parseSeason(season: any) {
  const {
    maincrop, 
    intercrop, 
    soil_type: soilType, 
    variety, 
    seed_density: seedDensity, 
    seed_date: seedDate,
    max_allowed_fertilizer: maxAllowedFertilizer,
    fertilizer_applications: fertilizerApplications,
    soil_tillage_applications: soilTillageApplications,
    crop_protection_applications: cropProtectionApplications,
    nitrate,
    phosphor,
    potassium,
    rks,
    ph,
    harvest_date: harvestDate,
    harvest_weight: harvestWeight,
    falling_number: fallingNumber,
    moisture,
    protein_content: proteinContent
  } = season;
  return {
    maincrop, 
    intercrop, 
    soilType, 
    variety, 
    seedDensity, 
    seedDate: seedDate? new Date(seedDate) : undefined,
    fertilizerApplications: (fertilizerApplications as any[]).map(
      (fertilizerApplication) => parseFertilizerApplication(fertilizerApplication)
    ),
    soilTillageApplications: (soilTillageApplications as any[]).map(
      (soilTillageApplication) => parseSoilTillageApplication(soilTillageApplication)
    ),
    cropProtectionApplications: (cropProtectionApplications as any[]).map(
      (cropProtectionApplication) => parseCropProtectionApplication(cropProtectionApplication)
    ),
    nitrate,
    phosphor,
    potassium,
    rks,
    ph,
    maxAllowedFertilizer,
    harvestDate: harvestDate? new Date(harvestDate) : undefined,
    harvestWeight,
    fallingNumber,
  moisture,
  proteinContent,
  } as Season;
}

export function deparseSeason(season: Season) {
  const {
    maincrop, 
    intercrop, 
    soilType, 
    variety, 
    seedDensity, 
    seedDate,
    maxAllowedFertilizer,
    fertilizerApplications,
    soilTillageApplications,
    cropProtectionApplications,
    nitrate,
    phosphor,
    potassium,
    rks,
    ph,
    harvestDate,
    harvestWeight,
    fallingNumber,
  moisture,
  proteinContent,
  } = season;
  return {
    maincrop, 
    intercrop, 
    soil_type: soilType, 
    variety, 
    seed_density: seedDensity, 
    seed_date: seedDate,
    max_allowed_fertilizer: maxAllowedFertilizer,
    fertilizer_applications: fertilizerApplications,
    soil_tillage_applications: soilTillageApplications,
    crop_protection_applications: cropProtectionApplications,
    nitrate,
    phosphor,
    potassium,
    rks,
    ph,
    harvest_date: harvestDate,
    harvest_weight: harvestWeight,
    falling_number: fallingNumber,
    moisture,
    protein_content: proteinContent
  };
}