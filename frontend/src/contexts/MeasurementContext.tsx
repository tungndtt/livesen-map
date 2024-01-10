import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useSelectionContext } from "./SelectionContext";
import { useNdviRasterContext } from "./NdviRasterContext";
import { useNotificationContext } from "./NotificationContext";
import { SubField, parseSubField } from "../types/subfield";
import {
  MeasurementPosition,
  parseMeasurementPosition,
  deparseMeasurementPosition,
} from "../types/measurement";

type MeasurementPositionMap = {
  [measurementId: number]: MeasurementPosition;
};

type MeasurementSubFieldMap = {
  [measurementId: number]: SubField[];
};

type Visibility = {
  [measurementId: number]: boolean;
};

type MeasurementContextType = {
  positions: MeasurementPositionMap | undefined;
  subfields: MeasurementSubFieldMap | undefined;
  visibility: Visibility;
  recommendationVisible: boolean;
  setupMeasurementLayer: (measurements: any[], subfields: any[]) => void;
  toggleMeasurementRegion: (measurementId: number) => void;
  toggleRecommendationVisible: () => void;
  updateMeasurementPosition: (measurementPosition: MeasurementPosition) => void;
  updateSubFieldRecommendedFertilizer: (
    measurementId: number,
    updatedRecommendedFertilizer: any
  ) => void;
};

const MeasurementContext = createContext<MeasurementContextType>({
  positions: undefined,
  subfields: undefined,
  visibility: {},
  recommendationVisible: false,
  setupMeasurementLayer: () => {},
  toggleMeasurementRegion: () => {},
  toggleRecommendationVisible: () => {},
  updateMeasurementPosition: () => {},
  updateSubFieldRecommendedFertilizer: () => {},
});

export default function MeasurementProvider(props: { children: ReactNode }) {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const { ndviRasterVisible, toggleNdviRasterVisible } = useNdviRasterContext();
  const notify = useNotificationContext();
  const [positions, setPositions] = useState<
    MeasurementPositionMap | undefined
  >(undefined);
  const [subfields, setSubfields] = useState<
    MeasurementSubFieldMap | undefined
  >(undefined);
  const [visibility, setVisibility] = useState<Visibility>({});
  const [recommendationVisible, setRecommendationVisible] = useState(false);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/measurement";

  const reset = () => {
    setVisibility({});
    setRecommendationVisible(false);
  };

  useEffect(reset, [selectedFieldId, selectedSeasonId]);

  useEffect(() => {
    if (ndviRasterVisible) reset();
  }, [ndviRasterVisible]);

  const setupMeasurementLayer = (measurements: any[], subfields: any[]) => {
    const positionMap = {} as MeasurementPositionMap;
    measurements.forEach((measurement) => {
      const parsedMeasurementPosition = parseMeasurementPosition(measurement);
      positionMap[parsedMeasurementPosition.id] = parsedMeasurementPosition;
    });
    setPositions(positionMap);
    const subfieldMap = {} as MeasurementSubFieldMap;
    subfields.forEach((subfield) => {
      const parsedSubField = parseSubField(subfield);
      const measurementId = parsedSubField.measurementId;
      if (!subfieldMap?.[measurementId]) {
        subfieldMap[measurementId] = [];
      }
      subfieldMap[measurementId].push(parsedSubField);
    });
    setSubfields(subfieldMap);
  };

  const toggleMeasurementRegion = (measurementId: number) => {
    setVisibility((prevVisibility) => {
      if (!prevVisibility) return prevVisibility;
      if (ndviRasterVisible) toggleNdviRasterVisible();
      if (measurementId in prevVisibility) delete prevVisibility[measurementId];
      else prevVisibility[measurementId] = true;
      return { ...prevVisibility };
    });
  };

  const toggleRecommendationVisible = () => {
    setRecommendationVisible((prevRecommendationVisible) => {
      if (ndviRasterVisible) toggleNdviRasterVisible();
      return !prevRecommendationVisible;
    });
  };

  const updateMeasurementPosition = (
    measurementPosition: MeasurementPosition
  ) => {
    fetch(`${serverUrl}/position/${measurementPosition.id}`, {
      headers: {
        "Content-Type": "application/json",
        "Auth-Token": authenticationToken,
      },
      method: "PUT",
      body: JSON.stringify(deparseMeasurementPosition(measurementPosition)),
    })
      .then(async (response) => {
        if (response.ok) {
          setPositions((prevPositions) =>
            prevPositions
              ? {
                  ...prevPositions,
                  [measurementPosition.id]: measurementPosition,
                }
              : prevPositions
          );
          notify({
            message: "Successfully updated the measurement position",
            isError: false,
          });
        } else
          notify({
            message: "Failed to update the measurement position",
            isError: true,
          });
      })
      .catch((error) => notify({ message: error.message, isError: true }));
  };

  const updateSubFieldRecommendedFertilizer = (
    measurementId: number,
    updatedRecommendedFertilizer: any
  ) => {
    setSubfields((prevSubfields) =>
      prevSubfields
        ? {
            ...prevSubfields,
            [measurementId]: prevSubfields[measurementId].map((subfield) => ({
              ...subfield,
              recommendedFertilizerAmount:
                updatedRecommendedFertilizer[subfield.id],
            })),
          }
        : prevSubfields
    );
  };

  return (
    <MeasurementContext.Provider
      value={{
        positions,
        subfields,
        visibility,
        recommendationVisible,
        setupMeasurementLayer,
        toggleMeasurementRegion,
        toggleRecommendationVisible,
        updateMeasurementPosition,
        updateSubFieldRecommendedFertilizer,
      }}
    >
      {props.children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  return useContext(MeasurementContext);
}
