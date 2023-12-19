import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useSelectionContext } from "./SelectionContext";
import { Field, NdviRasterMap } from "../types/field";
import { Coordinates } from "../types/coordinate";

type Visibility = {
  ndviRaster: boolean;
  coordinates: boolean;
};

type FieldContextType = {
  ndviRasters: NdviRasterMap;
  coordinates: Coordinates | undefined;
  setupFieldLayer: (field: Field) => void;
  visibility: Visibility;
  toggleFieldRegion: () => void;
  toggleFieldNdviRaster: () => void;
};

const FieldContext = createContext<FieldContextType>({
  ndviRasters: {},
  coordinates: undefined,
  setupFieldLayer: () => {},
  visibility: { coordinates: false, ndviRaster: false },
  toggleFieldRegion: () => {},
  toggleFieldNdviRaster: () => {},
});

export default function FieldProvider(props: { children: ReactNode }) {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const [ndviRasters, setNdviRasters] = useState<NdviRasterMap>({});
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(
    undefined
  );
  const [visibility, setVisibility] = useState<Visibility>({
    ndviRaster: false,
    coordinates: false,
  });
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/field";

  useEffect(() => {
    setVisibility((prevVisibility) => {
      const ndviRaster =
        prevVisibility.ndviRaster && selectedSeasonId !== undefined;
      if (ndviRaster) getFieldNdviRaster();
      return {
        ...prevVisibility,
        ndviRaster: ndviRaster,
      };
    });
  }, [selectedSeasonId]);

  useEffect(() => {
    setVisibility((prevVisibility) => ({
      coordinates: prevVisibility.coordinates && selectedSeasonId !== undefined,
      ndviRaster: false,
    }));
  }, [selectedFieldId]);

  const setupFieldLayer = (field: Field) => {
    setNdviRasters(field.ndviRasters);
    setCoordinates(field.coordinates);
  };

  const toggleFieldRegion = () => {
    setVisibility((prevVisibility) => ({
      ...prevVisibility,
      coordinates: !prevVisibility.coordinates,
    }));
  };

  const toggleFieldNdviRaster = () => {
    if (!visibility.ndviRaster) {
      getFieldNdviRaster();
    } else {
      setVisibility((prevVisibility) => ({
        ...prevVisibility,
        ndviRaster: false,
      }));
    }
  };

  const getFieldNdviRaster = () => {
    if (!selectedSeasonId) return;
    if (selectedSeasonId in ndviRasters) {
      setVisibility((prevVisibility) => ({
        ...prevVisibility,
        ndviRaster: true,
      }));
    } else {
      fetch(`${serverUrl}/ndvi/${selectedFieldId}/${selectedSeasonId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const body = await response.json();
          const data = body["data"];
          if (response.ok) {
            setNdviRasters((prevNdviMap) => ({
              ...prevNdviMap,
              [selectedSeasonId]: data,
            }));
            setVisibility((prevVisibility) => ({
              ...prevVisibility,
              ndviRaster: true,
            }));
          } else
            setVisibility((prevVisibility) => ({
              ...prevVisibility,
              ndviRaster: false,
            }));
        })
        .catch(() =>
          setVisibility((prevVisibility) => ({
            ...prevVisibility,
            ndviRaster: false,
          }))
        );
    }
  };

  return (
    <FieldContext.Provider
      value={{
        ndviRasters,
        coordinates,
        setupFieldLayer,
        visibility,
        toggleFieldRegion,
        toggleFieldNdviRaster,
      }}
    >
      {props.children}
    </FieldContext.Provider>
  );
}

export function useFieldContext() {
  return useContext(FieldContext);
}
