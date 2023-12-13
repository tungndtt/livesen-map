import { LatLngLiteral } from "leaflet";

export type Coordinate = LatLngLiteral;
export type Coordinates = Coordinate[] | Coordinate[][] | Coordinate[][][];

export function parseCoordinates(coordinates: any) {
  return coordinates.map(function t(e: any) {
    return typeof e[0] === "number" ? { lng: e[0], lat: e[1] } : e.map(t);
  }) as Coordinates;
}