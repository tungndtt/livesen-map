import { Coordinates, parseCoordinates } from "./coordinate";

export type Field = {
  id: number;
  name: string;
  coordinates: Coordinates;
  straubingDistance: number;
  area: number;
};

export const parseField = (field: any) => {
  const {
    id,
    name,
    coordinates,
    straubing_distance: straubingDistance,
    area
  } = field;
  return {
    id,
    name,
    coordinates: parseCoordinates(coordinates),
    straubingDistance,
    area
  } as Field;
};