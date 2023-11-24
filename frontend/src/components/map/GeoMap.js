import { MapContainer, TileLayer } from "react-leaflet";
import FieldLayer from "./FieldLayer";
import RegionInterestLayer from "./RegionInterestLayer";

export default function GeoMap() {
  return (
    <MapContainer
      center={[51.1642292, 10.4541194]}
      zoom={4}
      scrollWheelZoom={true}
      style={{ position: "absolute", right: 0, width: "70%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FieldLayer />
      <RegionInterestLayer />
    </MapContainer>
  );
}
