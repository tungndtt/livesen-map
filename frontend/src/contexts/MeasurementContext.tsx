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
  Measurement,
  MeasurementPosition,
  MeasurementValues,
  parseMeasurement,
  deparseMeasurementPosition,
  deparseMeasurementValues,
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
  toggleAllMeasurementVisible: (isVisible: boolean) => void;
  toggleRecommendationVisible: () => void;
  determineMeasurementPositions: () => Promise<void>;
  updateMeasurementPosition: (measurementPosition: MeasurementPosition) => void;
  updateMeasurement: (
    measurementId: number,
    measurementValues: MeasurementValues
  ) => void;
  updateMeasurementSample: (measurementId: number, file: File) => void;
  showMeasurementSample: (measurementId: number) => Promise<string>;
  onEvent: (action: string, payload: any) => void;
};

const MeasurementContext = createContext<MeasurementContextType>({
  measurements: undefined,
  positions: undefined,
  subfields: undefined,
  measurementVisible: {},
  recommendationVisible: false,
  toggleMeasurementVisible: () => {},
  toggleAllMeasurementVisible: () => {},
  toggleRecommendationVisible: () => {},
  determineMeasurementPositions: async () => {},
  updateMeasurementPosition: () => {},
  updateMeasurement: () => {},
  updateMeasurementSample: () => {},
  showMeasurementSample: async () => "",
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
    measurements.forEach((measurement, idx) => {
      measurement.idx = idx;
      positionMap[measurement.id] = measurement;
    });
    setPositions(positionMap);
    const subfieldMap = {} as MeasurementSubFieldMap;
    fetchedSubFields.forEach((subfield) => {
      const parsedSubField = parseSubField(subfield);
      const measurementId = parsedSubField.measurementId;
      parsedSubField.measurementIdx = positionMap[measurementId].idx;
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

  const toggleMeasurementVisible = (measurementId: number) => {
    setMeasurementVisible((prevVisibility) => {
      if (ndviRasterVisible) toggleNdviRasterVisible();
      if (measurementId in prevVisibility) delete prevVisibility[measurementId];
      else prevVisibility[measurementId] = true;
      return { ...prevVisibility };
    });
  };

  const toggleAllMeasurementVisible = (isVisible: boolean) => {
    if (!isVisible) setMeasurementVisible({});
    else
      setMeasurementVisible((prevVisibility) => {
        if (ndviRasterVisible) toggleNdviRasterVisible();
        measurements?.forEach(({ id }) => (prevVisibility[id] = true));
        return { ...prevVisibility };
      });
  };

  const toggleRecommendationVisible = () => {
    setRecommendationVisible((prevRecommendationVisible) => {
      if (ndviRasterVisible) toggleNdviRasterVisible();
      return !prevRecommendationVisible;
    });
  };

  const updateMeasurement = (
    measurementId: number,
    measurementValues: MeasurementValues
  ) => {
    doRequest(
      `measurement/upgister/${measurementId}`,
      "PUT",
      deparseMeasurementValues(measurementValues)
    )
      .then(async (response) => {
        const message = (await response.json())["data"];
        notify({ message: message, isError: false });
      })
      .catch((error) => notify({ message: error, isError: true }));
  };

  const updateMeasurementSample = (measurementId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    doRequest(`measurement/sample/${measurementId}`, "PUT", formData, true)
      .then(async (response) => {
        if (response.status === 413) {
          notify({
            message: "Uploaded sample exceeds the allowed size",
            isError: true,
          });
        } else {
          const message = (await response.json())["data"];
          notify({
            message: message,
            isError: false,
          });
        }
      })
      .catch((error) => notify({ message: error, isError: true }));
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
      .catch((error) => notify({ message: error, isError: true }));
  };

  const showMeasurementSample = (measurementId: number) => {
    return new Promise<string>((resolve) =>
      doRequest(`measurement/sample/${measurementId}`, "GET")
        .then(async (response) => {
          if (response.ok) {
            const data = await response.blob();
            resolve(URL.createObjectURL(data));
          } else {
            notify({
              message: "Cannot retrieve the sample image",
              isError: true,
            });
          }
        })
        .catch((error) => notify({ message: error, isError: true }))
    );
  };

  const onEvent = (action: string, payload: any) => {
    const { field_id: fieldId, season_id: seasonId } = payload;
    if (fieldId !== selectedFieldId || seasonId !== selectedSeasonId) return;
    const updateMeasurement = (measurement: Measurement) => {
      setMeasurements((prevMeasurements) => {
        if (prevMeasurements) {
          const index = prevMeasurements.findIndex(
            (prevMeasurement) => prevMeasurement.id === measurement.id
          );
          if (index !== -1) {
            prevMeasurements[index] = {
              ...prevMeasurements[index],
              ...measurement,
            };
            prevMeasurements = [...prevMeasurements];
          }
        }
        return prevMeasurements;
      });
    };
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
        updateMeasurement(updatedMeasurement);
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
      case "update_sample": {
        const { measurement } = payload;
        const updatedMeasurement = parseMeasurement(measurement);
        updateMeasurement(updatedMeasurement);
        break;
      }
      case "update_position": {
        const { measurement } = payload;
        const updatedMeasurement = parseMeasurement(measurement);
        setPositions((prevPositions) =>
          prevPositions
            ? {
                ...prevPositions,
                [updatedMeasurement.id]: {
                  ...prevPositions[updatedMeasurement.id],
                  ...updatedMeasurement,
                },
              }
            : prevPositions
        );
        updateMeasurement(updatedMeasurement);
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
        toggleAllMeasurementVisible,
        toggleRecommendationVisible,
        determineMeasurementPositions,
        updateMeasurementPosition,
        updateMeasurement,
        updateMeasurementSample,
        showMeasurementSample,
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
