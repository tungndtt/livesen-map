import { Coordinates, parseCoordinates } from "./coordinate";

export type NdviRasterMap = {
  [seasonId: string]: string;
};

export type Field = {
  id: number;
  name: string;
  coordinates: Coordinates;
  straubingDistance: number;
  area: number;
  ndviRasters: NdviRasterMap;
};

export const parseField = (field: any) => {
  const {
    id,
    name,
    coordinates,
    straubing_distance: straubingDistance,
    area,
    ndvi_rasters: ndviRasters,
  } = field;
  return {
    id,
    name,
    coordinates: parseCoordinates(coordinates),
    straubingDistance,
    area,
    ndviRasters,
  } as Field;
};