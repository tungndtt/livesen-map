import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useFieldContext } from "./FieldContext";
import { usePeriodContext } from "./PeriodContext";
import { useNotificationContext } from "./NotificationContext";
import {
  Measurement,
  NutrientMeasurement,
  parseMeasurement,
  parseSubfield,
} from "../types/measurement";

type SelectedMeasurement = { [measurementId: number]: Measurement };

type MeasurementContextType = {
  measurements: Measurement[] | undefined;
  determineMeasurementPositions: () => Promise<string>;
  updateMeasurement: (
    _measurementId: number,
    _options: NutrientMeasurement
  ) => Promise<string>;
  selectedMeasurements: SelectedMeasurement;
  setSelectedMeasurement: (measurementId: number) => void;
};

const MeasurementContext = createContext<MeasurementContextType>({
  measurements: undefined,
  determineMeasurementPositions: () => new Promise(() => {}),
  updateMeasurement: (_measurementId: number, _options: NutrientMeasurement) =>
    new Promise(() => {}),
  selectedMeasurements: {},
  setSelectedMeasurement: (_measurementId: number) => {},
});

export default function MeasurementProvider(props: { children: ReactNode }) {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedField } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [measurements, setMeasurements] = useState<Measurement[] | undefined>(
    undefined
  );
  const [selectedMeasurements, setSelectedMeasurements] =
    useState<SelectedMeasurement>({});
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/measurement";

  const initializeMeasurements = (
    fetchedMeasurements: any[],
    fetchedSubfields: any[]
  ) => {
    const measurements = [] as Measurement[];
    const subfieldMeasurementMap = {} as { [subfieldId: number]: Measurement };
    fetchedMeasurements.forEach((fetchedMeasurement) => {
      const measurement = parseMeasurement(fetchedMeasurement);
      measurements.push(measurement);
      subfieldMeasurementMap[fetchedMeasurement["subfield_id"]] = measurement;
    });
    fetchedSubfields.forEach((fetchedSubfield) => {
      const measurement = subfieldMeasurementMap[fetchedSubfield["id"]];
      measurement.subfield = parseSubfield(fetchedSubfield);
    });
    setMeasurements(measurements);
    setSelectedMeasurements({});
  };

  useEffect(() => {
    if (authenticationToken && selectedField?.id && selectedPeriod) {
      Promise.all([
        fetch(`${serverUrl}/subfield/${selectedField.id}/${selectedPeriod}`, {
          headers: { "Auth-Token": authenticationToken },
          method: "GET",
        }),
        fetch(`${serverUrl}/${selectedField.id}/${selectedPeriod}`, {
          headers: { "Auth-Token": authenticationToken },
          method: "GET",
        }),
      ])
        .then(async ([subfieldResponse, measurementResponse]) => {
          const subfieldResponseBody = await subfieldResponse.json();
          const measurementResponseBody = await measurementResponse.json();
          if (subfieldResponse.ok && measurementResponse.ok) {
            initializeMeasurements(
              measurementResponseBody,
              subfieldResponseBody
            );
          }
        })
        .catch((errors) => {
          for (let i = 0; i < errors.length; i++) {
            const error = errors[i];
            if (error) {
              notify({ message: error.message, isError: true });
              break;
            }
          }
        });
    } else {
      setMeasurements(undefined);
      setSelectedMeasurements({});
    }
  }, [authenticationToken, selectedField?.id, selectedPeriod]);

  const determineMeasurementPositions = () => {
    return new Promise<string>((resolve, reject) => {
      fetch(
        `${serverUrl}/determine_positions/${selectedField?.id}/${selectedPeriod}`,
        {
          headers: { "Auth-Token": authenticationToken },
          method: "GET",
        }
      )
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            const { measurements, subfields } = responseBody;
            initializeMeasurements(measurements, subfields);
            resolve("Measurement poisitions were determined");
          } else reject(responseBody["data"]);
        })
        .catch((error) => reject(error.message));
    });
  };

  const updateMeasurement = (
    measurementId: number,
    options: NutrientMeasurement
  ) => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/upgister/${measurementId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "PUT",
        body: JSON.stringify(options),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            const updatedMeasurement = parseMeasurement(responseBody);
            setMeasurements((prevMeasurements) => {
              if (prevMeasurements) {
                const index = prevMeasurements.findIndex(
                  (prevMeasurement) =>
                    prevMeasurement.id === updatedMeasurement.id
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
            resolve("Successfully updated measurement");
          } else reject(responseBody["data"]);
        })
        .catch((error) => reject(error));
    });
  };

  const setSelectedMeasurement = (measurementId: number) => {
    setSelectedMeasurements((prevSelectedMeasurements) => {
      if (prevSelectedMeasurements[measurementId])
        delete prevSelectedMeasurements?.[measurementId];
      else {
        const selectedMeasurement = measurements?.find(
          ({ id }) => id === measurementId
        ) as Measurement;
        prevSelectedMeasurements[measurementId] = selectedMeasurement;
      }
      return { ...prevSelectedMeasurements };
    });
  };

  return (
    <MeasurementContext.Provider
      value={{
        measurements,
        determineMeasurementPositions,
        updateMeasurement,
        selectedMeasurements,
        setSelectedMeasurement,
      }}
    >
      {props.children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  return useContext(MeasurementContext);
}
