import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSelectionContext } from "./SelectionContext";
import { Measurement, SubField } from "../types/measurement";
import { Coordinate } from "../types/coordinate";

type MeasurementCoordinatesMap = {
  [measurementId: number]: { position: Coordinate; subfields: SubField[] };
};

type MeasurementNdviRange = {
  low: number;
  high: number;
  bins: number;
};

type MeasurementContextType = {
  measurementCoordinates: MeasurementCoordinatesMap;
  measurementNdviRange: MeasurementNdviRange | undefined;
  setupMeasurementLayer: (measurements: Measurement[]) => void;
  toggleMeasurementRegion: (measurement: Measurement) => void;
};

const MeasurementContext = createContext<MeasurementContextType>({
  measurementCoordinates: {},
  measurementNdviRange: undefined,
  setupMeasurementLayer: () => {},
  toggleMeasurementRegion: () => {},
});

export default function MeasurementProvider(props: { children: ReactNode }) {
  const { selectedFieldId, selectedSeasonId } = useSelectionContext();
  const [measurementCoordinates, setMeasurementCoordinates] =
    useState<MeasurementCoordinatesMap>({});
  const [measurementNdviRange, setMeasurementNdviRange] = useState<
    MeasurementNdviRange | undefined
  >(undefined);

  useEffect(() => {
    setMeasurementCoordinates({});
    setMeasurementNdviRange(undefined);
  }, [selectedFieldId, selectedSeasonId]);

  const setupMeasurementLayer = (measurements: Measurement[]) => {
    let low = 1,
      high = -1;
    measurements.forEach(({ subfields }) => {
      subfields.forEach(({ ndvi }) => {
        low = Math.min(low, ndvi);
        high = Math.max(high, ndvi);
      });
    });
    const bins = measurements.length;
    setMeasurementNdviRange({ low, high, bins });
  };

  const toggleMeasurementRegion = (measurement: Measurement) => {
    setMeasurementCoordinates((prevSelectedMeasurement) => {
      if (measurement.id in prevSelectedMeasurement)
        delete prevSelectedMeasurement[measurement.id];
      else
        prevSelectedMeasurement[measurement.id] = {
          position: measurement.position,
          subfields: measurement.subfields,
        };
      return { ...prevSelectedMeasurement };
    });
  };

  return (
    <MeasurementContext.Provider
      value={{
        measurementCoordinates,
        measurementNdviRange,
        setupMeasurementLayer,
        toggleMeasurementRegion,
      }}
    >
      {props.children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  return useContext(MeasurementContext);
}
