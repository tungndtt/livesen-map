import { Coordinate, Coordinates, parseCoordinates } from "./coordinate";

export type SubField = {
  id: number;
  measurementId: number;
  coordinates: Coordinates;
  area: number;
  ndvi: number;
  recommendedFertilizerAmount: number;
}

export const parseSubfield = (subfield: any) => {
  const {
    id,
    measurement_id: measurementId,
    coordinates,
    area,
    ndvi,
    recommended_fertilizer_amount: recommendedFertilizerAmount,
  } = subfield;
  return {
    id,
    measurementId,
    coordinates: parseCoordinates(coordinates),
    area,
    ndvi,
    recommendedFertilizerAmount,
  } as SubField;
};

export type NutrientMeasurement = {
  nitrate?: number;
  phosphor?: number;
  potassium?: number;
};

export type MeasurementNutrientField =
  | "nitrate"
  | "phosphor"
  | "potassium";

export type Measurement = {
  id: number;
  position: Coordinate;
  ndvi: number;
  subfields: SubField[];
} & NutrientMeasurement;

export const parseMeasurement = (measurement: any) => {
  const {
    id,
    longitude,
    latitude,
    nitrate,
    phosphor,
    potassium,
    ndvi,
  } = measurement;
  return {
    id,
    position: { lng: longitude, lat: latitude },
    nitrate,
    phosphor,
    potassium,
    ndvi
  } as Measurement;
};
