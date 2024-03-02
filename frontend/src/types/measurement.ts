import { Coordinate } from "./coordinate";

export type MeasurementValues = {
  nitrate?: number;
  phosphor?: number;
  potassium?: number;
  charge?: number;
  stadium?: number;
  soilCondition?: string
}

export type MeasurementPosition = {
  id: number;
  idx?: number;
  position: Coordinate;
}

export type Measurement = {ndvi: number;} & MeasurementPosition & MeasurementValues;

export const parseMeasurement = (measurement: any) => {
  const {
    id, 
    longitude, 
    latitude,
    ndvi,
    nitrate,
    phosphor,
    potassium,
    charge,
    stadium,
    soil_condition: soilCondition
  } = measurement;
  return {
    id, 
    position: {lng: longitude, lat: latitude},
    ndvi,
    nitrate,
    phosphor,
    potassium,
    charge,
    stadium,
    soilCondition
  } as Measurement;
};

export const deparseMeasurementPosition = (measurementPosition: MeasurementPosition) => {
  const {lng: longitude, lat: latitude} = measurementPosition.position;
  return {longitude, latitude};
}

export const deparseMeasurementValues = (measurementValues: MeasurementValues) => {
  const {
    nitrate,
    phosphor,
    potassium,
    charge,
    stadium,
    soilCondition: soil_condition
  } = measurementValues;
  return {
    nitrate,
    phosphor,
    potassium,
    charge,
    stadium,
    soil_condition
  };
}