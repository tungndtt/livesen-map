import { Coordinates, parseCoordinates } from "./coordinate";

type PeriodNdvi = {[period: string]: string};

export type Field = {
  id: number;
  name: string;
  coordinates: Coordinates;
  straubingDistance: number;
  area: number;
  periodNdvi: PeriodNdvi;
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
  const periodNdvi = {} as PeriodNdvi;
  (ndviRasters as string[])?.forEach((ndviRaster) => {
    const [period, raster] = ndviRaster.split("_");
    periodNdvi[period] = raster;
  });

  return {
    id,
    name,
    coordinates: parseCoordinates(coordinates),
    straubingDistance,
    area,
    periodNdvi,
  } as Field;
};