import { createContext, useContext, useState, useEffect } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useFieldContext } from "./FieldContext";
import { usePeriodContext } from "./PeriodContext";
import { useNotificationContext } from "./NotificationContext";

const MeasurementContext = createContext({
  measurements: undefined,
  determineMeasurementPositions: () => new Promise(() => {}),
  updateMeasurement: (_measurementId, _options) => new Promise(() => {}),
  selectedMeasurements: undefined,
  setSelectedMeasurement: (_measurementId, _key, _coordinates) => {},
});

const parseMeasurement = (measurement) => {
  const {
    id,
    longitude,
    latitude,
    nitrate_measurement,
    phosphor_measurement,
    potassium_measurement,
    ndvi_value,
  } = measurement;
  return {
    id,
    position: { lng: longitude, lat: latitude },
    nitrate_measurement,
    phosphor_measurement,
    potassium_measurement,
    ndvi_value,
  };
};

const parseSubfield = (subfield) => {
  const {
    coordinates,
    area,
    recommended_fertilizer_amount: recommendedFertilizerAmount,
  } = subfield;
  return {
    coordinates: coordinates.map(function t(e) {
      return e[0] instanceof Number ? { lng: e[0], lat: e[1] } : e.map(t);
    }),
    area,
    recommendedFertilizerAmount,
  };
};

export default function MeasurementProvider({ children }) {
  const { authenticationToken } = useAuthenticationContext();
  const { selectedField } = useFieldContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [measurements, setMeasurements] = useState(undefined);
  const [selectedMeasurements, setSelectedMeasurements] = useState(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/measurement";

  const initializeMeasurements = (fetchedMeasurements, fetchedSubfields) => {
    const measurements = [];
    const subfieldMeasurementMap = {};
    fetchedMeasurements.forEach((fetchedMeasurement) => {
      const measurement = parseMeasurement(fetchedMeasurement);
      measurements.push(measurement);
      subfieldMeasurementMap[fetchedMeasurement["subfield_id"]] = measurement;
    });
    fetchedSubfields.forEach((fetchedSubfield) => {
      const measurement = subfieldMeasurementMap[fetchedSubfield["id"]];
      measurement["subfield"] = parseSubfield(fetchedSubfield);
    });
    setMeasurements(measurements);
    setSelectedMeasurements({ positions: {}, subfields: {} });
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
          if (!subfieldResponse.ok) {
            notify({ message: subfieldResponseBody["data"], isError: true });
          } else if (!measurementResponse.ok) {
            notify({ message: measurementResponseBody["data"], isError: true });
          } else {
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
              notify({ message: error, isError: true });
              break;
            }
          }
        });
    } else {
      setMeasurements(undefined);
      setSelectedMeasurements(undefined);
    }
  }, [authenticationToken, selectedField?.id, selectedPeriod]);

  const determineMeasurementPositions = () => {
    return new Promise((resolve, reject) => {
      fetch(
        `${serverUrl}/determine_positions/${selectedField}/${selectedPeriod}`,
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
        .catch((error) => reject(error));
    });
  };

  const updateMeasurement = (measurementId, options) => {
    return new Promise((resolve, reject) => {
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
              const index = prevMeasurements.find(
                (prevMeasurement) =>
                  prevMeasurement.id === updatedMeasurement.id
              );
              if (index !== -1) {
                prevMeasurements[index] = {
                  ...prevMeasurements[index],
                  updatedMeasurement,
                };
                return [...prevMeasurements];
              } else {
                return prevMeasurements;
              }
            });
            resolve("Successfully updated measurement");
          } else reject(responseBody["data"]);
        })
        .catch((error) => reject(error));
    });
  };

  const setSelectedMeasurement = (measurementId, key, coordinates) => {
    setSelectedMeasurements((prevSelectedMeasurements) => {
      const prevSelectedMeasurement = prevSelectedMeasurements[key];
      if (coordinates) {
        prevSelectedMeasurement = {
          ...prevSelectedMeasurement,
          [measurementId]: coordinates,
        };
      } else delete prevSelectedMeasurement?.[measurementId];
      return {
        ...prevSelectedMeasurements,
        [key]: prevSelectedMeasurement,
      };
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
      {children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurementContext() {
  return useContext(MeasurementContext);
}
