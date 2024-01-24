import { useState, useEffect, useRef } from "react";
import { Modal, CircularProgress, Box } from "@mui/material";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
//@ts-ignore
import parseGeoraster from "georaster";
import GeoRasterLayer, { GeoRaster } from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { useAuthenticationContext } from "../../contexts/AuthenticationContext";
import { useSelectionContext } from "../../contexts/SelectionContext";
import { useNdviRasterContext } from "../../contexts/NdviRasterContext";
import { useNotificationContext } from "../../contexts/NotificationContext";
import ndvi2RBGA from "../../utils/ndvi2RBGA";
import GradientBar from "../../utils/GradientBar";

window.proj4 = proj4;

export default function NdviRasterLayer() {
  const { authenticationToken, signOut } = useAuthenticationContext();
  const { selectedSeasonId } = useSelectionContext();
  const { ndviRasterVisible, ndviRasters } = useNdviRasterContext();
  const notify = useNotificationContext();
  //@ts-ignore
  const ndviLayerRef = useRef<GeoRasterLayer | undefined>(undefined);
  const context = useLeafletContext();
  const map = useMap();
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const [ndviRange, setNdviRange] = useState<number[] | undefined>(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/ndvi_raster";

  useEffect(() => {
    const container = context.layerContainer || context.map;
    if (
      ndviRasterVisible &&
      selectedSeasonId &&
      ndviRasters?.[selectedSeasonId]
    ) {
      setLoadingNdvi(true);
      fetch(`${serverUrl}/${ndviRasters[selectedSeasonId]}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            parseGeoraster(arrayBuffer).then((georaster: GeoRaster) => {
              let count = 0;
              let ndviRange = [1, -1];
              const resolution = georaster.width * georaster.height;
              if (ndviLayerRef.current) {
                container.removeLayer(ndviLayerRef.current);
              }
              ndviLayerRef.current = new GeoRasterLayer({
                georaster: georaster,
                opacity: 1,
                pixelValuesToColorFn: (values) => {
                  const ndvi = values[0];
                  if (ndvi >= 0) {
                    ndviRange[0] = Math.min(ndviRange[0], ndvi);
                    ndviRange[1] = Math.max(ndviRange[1], ndvi);
                  }
                  count++;
                  if (count == resolution) {
                    setLoadingNdvi(false);
                    ndviRange[0] = Math.max(ndviRange[0], 0);
                    ndviRange[1] = Math.min(ndviRange[1], 1);
                    setNdviRange([...ndviRange]);
                  }
                  return ndvi2RBGA(ndvi);
                },
                resolution: resolution,
              });
              container.addLayer(ndviLayerRef.current);
              map.fitBounds(ndviLayerRef.current.getBounds());
            });
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
  }, [context, map, ndviRasters, ndviRasterVisible, selectedSeasonId]);

  return (
    <>
      {ndviRange && ndviRasterVisible && (
        <Box
          sx={{
            position: "absolute",
            right: "10px",
            zIndex: 1000,
            width: "70%",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <GradientBar
            caption="NDVI"
            low={ndviRange[0]}
            high={ndviRange[1]}
            lowLabel={ndviRange[0]}
            highLabel={ndviRange[1]}
          />
        </Box>
      )}
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
    </>
  );
}
