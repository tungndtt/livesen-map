import { createContext, useContext, useState, useEffect } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useFieldContext } from "./FieldContext";
import { usePeriodContext } from "./PeriodContext";
import { useNotificationContext } from "./NotificationContext";

const MeasurementContext = createContext({
  measurements: undefined,
  determineMeasurementPositions: () => new Promise(() => {}),
  updateMeasurement: (
    _measurementId,
    _nitrate_measurement,
    _phosphor_measurement,
    _potassium_measurement
  ) => new Promise(() => {}),
});

const parseMeasurement = (measurement) => {
  const {
    id,
    longitude,
    latitude,
    nitrate_measurement: nitrate,
    phosphor_measurement: phosphor,
    potassium_measurement: potassium,
    ndvi_value: ndvi,
  } = measurement;
  return {
    id,
    longitude,
    latitude,
    nitrate,
    phosphor,
    potassium,
    ndvi,
  };
};

export default function MeasurementProvider({ children }) {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedFieldId } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [measurements, setMeasurements] = useState(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/measurement";

  useEffect(() => {
    if (authenticationToken && selectedFieldId && selectedPeriod) {
      fetch(`${serverUrl}/${selectedFieldId}/${selectedPeriod}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const fetchedMeasurements = await response.json();
          setMeasurements(
            fetchedMeasurements.map((measurement) =>
              parseMeasurement(measurement)
            )
          );
        })
        .catch((error) => notify({ message: error, isError: true }));
    } else {
      setMeasurements(undefined);
    }
  }, [authenticationToken, selectedFieldId, selectedPeriod]);

  const determineMeasurementPositions = () => {
    return new Promise((resolve, reject) => {
      fetch(
        `${serverUrl}/determine_positions/${selectedFieldId}/${selectedPeriod}`,
        {
          headers: { "Auth-Token": authenticationToken },
          method: "GET",
        }
      )
        .then(async (response) => {
          if (response.ok) {
            const fetchedMeasurements = await response.json();
            setMeasurements(
              fetchedMeasurements.map((measurement) =>
                parseMeasurement(measurement)
              )
            );
            resolve("Measurement poisitions were determined");
          } else {
            const body = await response.data();
            reject(body["data"]);
          }
        })
        .catch((error) => reject(error));
    });
  };

  const updateMeasurement = (
    measurementId,
    nitrate_measurement,
    phosphor_measurement,
    potassium_measurement
  ) => {
    return new Promise((resolve, reject) => {
      fetch(`${serverUrl}/upgister/${measurementId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "PUT",
        body: JSON.stringify({
          nitrate_measurement,
          phosphor_measurement,
          potassium_measurement,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const updatedMeasurement = parseMeasurement(await response.json());
            setMeasurements((prevMeasurements) => {
              const index = prevMeasurements.find(
                (prevMeasurement) =>
                  prevMeasurement.id === updatedMeasurement.id
              );
              if (index !== -1) {
                prevMeasurements[index] = updatedMeasurement;
                return [...prevMeasurements];
              } else {
                return prevMeasurements;
              }
            });
            resolve("Successfully updated measurement");
          } else {
            const body = await response.data();
            reject(body["data"]);
          }
        })
        .catch((error) => reject(error));
    });
  };

  return (
    <MeasurementContext.Provider
      value={{ measurements, determineMeasurementPositions, updateMeasurement }}
    >
      {children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  return useContext(MeasurementContext);
}
