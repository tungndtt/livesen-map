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
  NutrientMeasurement,
  Measurement,
  MeasurementPosition,
  parseMeasurement,
  parseMeasurementPosition,
  deparseMeasurementPosition,
} from "../types/measurement";

type MeasurementPositionMap = {
  [measurementId: number]: MeasurementPosition;
};

type MeasurementSubFieldMap = {
  [measurementId: number]: SubField[];
};

type MeasurementVisible = {
  [measurementId: number]: boolean;
};

type MeasurementContextType = {
  measurements: Measurement[] | undefined;
  positions: MeasurementPositionMap | undefined;
  subfields: MeasurementSubFieldMap | undefined;
  measurementVisible: MeasurementVisible;
  recommendationVisible: boolean;
  toggleMeasurementVisible: (measurementId: number) => void;
  toggleRecommendationVisible: () => void;
  determineMeasurementPositions: () => Promise<void>;
  updateMeasurementPosition: (measurementPosition: MeasurementPosition) => void;
  updateMeasurement: (
    measurementId: number,
    options: NutrientMeasurement
  ) => void;
  onEvent: (action: string, payload: any) => void;
};

const MeasurementContext = createContext<MeasurementContextType>({
  measurements: undefined,
  positions: undefined,
  subfields: undefined,
  measurementVisible: {},
  recommendationVisible: false,
  toggleMeasurementVisible: () => {},
  toggleRecommendationVisible: () => {},
  determineMeasurementPositions: async () => {},
  updateMeasurementPosition: () => {},
  updateMeasurement: () => {},
  onEvent: () => {},
});

export default function MeasurementProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const { ndviRasterVisible, toggleNdviRasterVisible } = useNdviRasterContext();
  const [measurements, setMeasurements] = useState<Measurement[] | undefined>(
    undefined
  );
  const [positions, setPositions] = useState<
    MeasurementPositionMap | undefined
  >(undefined);
  const [subfields, setSubfields] = useState<
    MeasurementSubFieldMap | undefined
  >(undefined);
  const [measurementVisible, setMeasurementVisible] =
    useState<MeasurementVisible>({});
  const [recommendationVisible, setRecommendationVisible] = useState(false);

  const initializeMeasurements = (
    fetchedMeasurements: any[],
    fetchedSubFields: any[]
  ) => {
    const measurements = fetchedMeasurements
      .map((fetchedMeasurement) => parseMeasurement(fetchedMeasurement))
      .sort((m1, m2) => m1.ndvi - m2.ndvi);
    setMeasurements(measurements);
    const positionMap = {} as MeasurementPositionMap;
    fetchedMeasurements.forEach((measurement) => {
      const parsedMeasurementPosition = parseMeasurementPosition(measurement);
      positionMap[parsedMeasurementPosition.id] = parsedMeasurementPosition;
    });
    setPositions(positionMap);
    const subfieldMap = {} as MeasurementSubFieldMap;
    fetchedSubFields.forEach((subfield) => {
      const parsedSubField = parseSubField(subfield);
      const measurementId = parsedSubField.measurementId;
      if (!subfieldMap?.[measurementId]) {
        subfieldMap[measurementId] = [];
      }
      subfieldMap[measurementId].push(parsedSubField);
    });
    setSubfields(subfieldMap);
  };

  useEffect(() => {
    const reset = () => setMeasurements(undefined);
    if (selectedFieldId && selectedSeasonId) {
      Promise.all([
        doRequest(
          `measurement/subfield/${selectedFieldId}/${selectedSeasonId}`,
          "GET"
        ),
        doRequest(`measurement/${selectedFieldId}/${selectedSeasonId}`, "GET"),
      ])
        .then(async ([subfieldResponse, measurementResponse]) => {
          const subfieldResponseBody = await subfieldResponse.json();
          const measurementResponseBody = await measurementResponse.json();
          initializeMeasurements(measurementResponseBody, subfieldResponseBody);
        })
        .catch(reset);
    } else reset();
  }, [selectedFieldId, selectedSeasonId]);

  const determineMeasurementPositions = async () => {
    return doRequest(
      `measurement/position/${selectedFieldId}/${selectedSeasonId}`,
      "GET"
    )
      .then(async (response) => {
        const message = (await response.json())["data"];
        notify({ message: message, isError: false });
      })
      .catch((error) => notify({ message: error, isError: true }));
  };

  const reset = () => {
    setMeasurementVisible({});
    setRecommendationVisible(false);
  };

  useEffect(reset, [selectedFieldId, selectedSeasonId]);

  useEffect(() => {
    if (ndviRasterVisible) reset();
  }, [ndviRasterVisible]);

  const updateMeasurement = (
    measurementId: number,
    options: NutrientMeasurement
  ) => {
    doRequest(`measurement/upgister/${measurementId}`, "PUT", options).then(
      async (response) => {
        const message = (await response.json())["data"];
        notify({ message: message, isError: false });
      }
    );
  };

  const toggleMeasurementVisible = (measurementId: number) => {
    setMeasurementVisible((prevVisibility) => {
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
    doRequest(
      `measurement/position/${measurementPosition.id}`,
      "PUT",
      deparseMeasurementPosition(measurementPosition)
    )
      .then(async (response) => {
        const message = (await response.json())["data"];
        notify({
          message: message,
          isError: false,
        });
      })
      .catch(() => {
        notify({
          message: "Failed to update the measurement position",
          isError: true,
        });
      });
  };

  const onEvent = (action: string, payload: any) => {
    const { field_id: fieldId, season_id: seasonId } = payload;
    if (fieldId !== selectedFieldId || seasonId !== selectedSeasonId) return;
    switch (action) {
      case "create": {
        const { measurements, subfields } = payload;
        initializeMeasurements(measurements, subfields);
        break;
      }
      case "update_measurement": {
        const {
          measurement,
          subfield_recommended_fertilizer: subfieldRecommendedFertilizer,
        } = payload;
        const updatedMeasurement = parseMeasurement(measurement);
        setMeasurements((prevMeasurements) => {
          if (prevMeasurements) {
            const index = prevMeasurements.findIndex(
              (prevMeasurement) => prevMeasurement.id === updatedMeasurement.id
            );
            if (index !== -1) {
              prevMeasurements[index] = {
                ...prevMeasurements[index],
                ...updatedMeasurement,
              };
              prevMeasurements = [...prevMeasurements];
            }
          }
          return prevMeasurements;
        });
        setSubfields((prevSubfields) =>
          prevSubfields
            ? {
                ...prevSubfields,
                [updatedMeasurement.id]: prevSubfields[
                  updatedMeasurement.id
                ].map((subfield) => ({
                  ...subfield,
                  recommendedFertilizerAmount:
                    subfieldRecommendedFertilizer[subfield.id],
                })),
              }
            : prevSubfields
        );
        break;
      }
      case "update_position": {
        const position = parseMeasurementPosition(payload.measurement);
        setPositions((prevPositions) =>
          prevPositions
            ? { ...prevPositions, [position.id]: position }
            : prevPositions
        );
        break;
      }
    }
  };

  return (
    <MeasurementContext.Provider
      value={{
        measurements,
        positions,
        subfields,
        measurementVisible,
        recommendationVisible,
        toggleMeasurementVisible,
        toggleRecommendationVisible,
        determineMeasurementPositions,
        updateMeasurementPosition,
        updateMeasurement,
        onEvent,
      }}
    >
      {props.children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  return useContext(MeasurementContext);
}
