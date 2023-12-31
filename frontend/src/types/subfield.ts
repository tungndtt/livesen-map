import { Coordinates, parseCoordinates } from "./coordinate";

export type SubField = {
  id: number;
  measurementId: number;
  coordinates: Coordinates;
  area: number;
  ndvi: number;
  recommendedFertilizerAmount: number;
}

export const parseSubField = (subfield: any) => {
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