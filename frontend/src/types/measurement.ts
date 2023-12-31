import { Coordinate } from "./coordinate";

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
  ndvi: number;
} & NutrientMeasurement;

export const parseMeasurement = (measurement: any) => {
  const {
    id,
    nitrate,
    phosphor,
    potassium,
    ndvi,
  } = measurement;
  return {
    id,
    nitrate,
    phosphor,
    potassium,
    ndvi
  } as Measurement;
};

export type MeasurementPosition = {
  id: number;
  position: Coordinate;
}

export const parseMeasurementPosition = (measurement: any) => {
  const {id, longitude, latitude} = measurement;
  return {id, position: {lng: longitude, lat: latitude}} as MeasurementPosition;
}

export const deparseMeasurementPosition = (measurementPosition: MeasurementPosition) => {
  const {lng: longitude, lat: latitude} = measurementPosition.position;
  return {longitude, latitude};
}
