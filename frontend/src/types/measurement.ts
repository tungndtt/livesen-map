import { Coordinate, Coordinates, parseCoordinates } from "./coordinate";

export type NutrientMeasurement = {
  nitrate_measurement?: number;
  phosphor_measurement?: number;
  potassium_measurement?: number;
};

export type MeasurementNutrientField =
  | "nitrate_measurement"
  | "phosphor_measurement"
  | "potassium_measurement";

export type Measurement = {
  id: number;
  position: Coordinate;
  ndvi_value: number;
  subfield: SubField;
} & NutrientMeasurement;

export type SubField = {
  coordinates: Coordinates;
  area: number;
  recommendedFertilizerAmount: number;
}

export const parseMeasurement = (measurement: any) => {
  const {
    id,
    longitude,
    latitude,
    nitrate_measurement,
    phosphor_measurement,
    potassium_measurement,
    ndvi_value,
  } = measurement;
  return {
    id,
    position: { lng: longitude, lat: latitude },
    nitrate_measurement,
    phosphor_measurement,
    potassium_measurement,
    ndvi_value
  } as Measurement;
};

export const parseSubfield = (subfield: any) => {
  const {
    coordinates,
    area,
    recommended_fertilizer_amount: recommendedFertilizerAmount,
  } = subfield;
  return {
    coordinates: parseCoordinates(coordinates),
    area,
    recommendedFertilizerAmount,
  } as SubField;
};