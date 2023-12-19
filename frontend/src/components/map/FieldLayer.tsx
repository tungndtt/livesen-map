import { useState, useEffect, useRef } from "react";
import { Modal, CircularProgress } from "@mui/material";
import { useLeafletContext } from "@react-leaflet/core";
import L from "leaflet";
import { useMap } from "react-leaflet";
//@ts-ignore
import parseGeoraster from "georaster";
import GeoRasterLayer, { GeoRaster } from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useSelectionContext } from "../../contexts/SelectionContext";
import { useFieldContext } from "../../contexts/FieldContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import ndvi2RBGA from "../../utils/ndvi2RBGA";

window.proj4 = proj4;

export default function FieldLayer() {
  const { authenticationToken, signOut } = useAuthenticationContext();
  const { selectedSeasonId } = useSelectionContext();
  const { visibility, ndviRasters, coordinates } = useFieldContext();
  const notify = useNotificationContext();
  //@ts-ignore
  const ndviLayerRef = useRef<GeoRasterLayer | undefined>(undefined);
  const fieldLayerRef = useRef<L.Polygon | undefined>(undefined);
  const context = useLeafletContext();
  const map = useMap();
  const container = context.layerContainer || context.map;
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/field";

  useEffect(() => {
    if (ndviLayerRef.current) container.removeLayer(ndviLayerRef.current);
    if (
      visibility.ndviRaster &&
      selectedSeasonId &&
      ndviRasters?.[selectedSeasonId]
    ) {
      setLoadingNdvi(true);
      fetch(`${serverUrl}/ndvi/${ndviRasters[selectedSeasonId]}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            parseGeoraster(arrayBuffer)
              .then((georaster: GeoRaster) => {
                ndviLayerRef.current = new GeoRasterLayer({
                  georaster: georaster,
                  opacity: 1,
                  pixelValuesToColorFn: (values) => ndvi2RBGA(values[0]),
                  resolution: georaster.width * georaster.height,
                });
                container.addLayer(ndviLayerRef.current);
                map.fitBounds(ndviLayerRef.current.getBounds());
              })
              .finally(() => setLoadingNdvi(false));
          } else {
            if (response.status === 401) {
              signOut();
              notify({ message: "Access token is outdated", isError: true });
            } else notify({ message: await response.text(), isError: true });
            setLoadingNdvi(false);
          }
        })
        .catch((error) => {
          signOut();
          notify({ message: error.message, isError: true });
          setLoadingNdvi(false);
        });
    }
    return () => {
      if (ndviLayerRef.current) container.removeLayer(ndviLayerRef.current);
    };
  }, [context, map, ndviRasters, visibility.ndviRaster, selectedSeasonId]);

  useEffect(() => {
    if (fieldLayerRef.current) container.removeLayer(fieldLayerRef.current);
    if (visibility.coordinates && coordinates) {
      fieldLayerRef.current = new L.Polygon(coordinates);
      container.addLayer(fieldLayerRef.current);
      map.fitBounds(fieldLayerRef.current.getBounds());
    }
    return () => {
      if (fieldLayerRef.current) container.removeLayer(fieldLayerRef.current);
    };
  }, [context, map, coordinates, visibility.coordinates]);

  return (
    <Modal
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
      open={loadingNdvi}
    >
      <CircularProgress />
    </Modal>
  );
}
