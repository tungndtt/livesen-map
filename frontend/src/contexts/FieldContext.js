import { createContext, useContext, useState, useEffect } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useRegionInterestContext } from "./RegionInterestContext";
import { usePeriodContext } from "./PeriodContext";
import { useNotificationContext } from "./NotificationContext";

const FieldContext = createContext({
  fields: undefined,
  registerField: (_name) => new Promise(() => {}),
  unregisterField: () => new Promise(() => {}),
  selectedField: undefined,
  setSelectedField: (_selectedField) => {},
  ndvi: undefined,
  setNdvi: (_ndvi) => {},
  getFieldNdvi: () => new Promise(() => {}),
});

const parseField = (field) => {
  const {
    id,
    name,
    coordinates,
    straubing_distance: straubingDistance,
    area,
    ndvi_rasters: ndviRasters,
  } = field;
  const periodNdvi = {};
  ndviRasters?.forEach((ndviRaster) => {
    const [period, raster] = ndviRaster.split("_");
    periodNdvi[period] = raster;
  });

  return {
    id,
    name,
    coordinates: coordinates.map(function t(e) {
      return typeof e[0] === "number" ? { lng: e[0], lat: e[1] } : e.map(t);
    }),
    straubingDistance,
    area,
    periodNdvi,
  };
};

export default function FieldProvider({ children }) {
  const { authenticationToken } = useAuthenticationContext();
  const { roi } = useRegionInterestContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [fields, setFields] = useState(undefined);
  const [selectedField, setSelectedField] = useState(undefined);
  const [ndvi, setNdvi] = useState(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/field";

  useEffect(() => {
    if (authenticationToken) {
      fetch(serverUrl, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const fetchedFields = await response.json();
          setFields(fetchedFields.map((field) => parseField(field)));
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    } else {
      setFields(undefined);
      setSelectedField(undefined);
      setNdvi(undefined);
    }
  }, [authenticationToken]);

  useEffect(() => {
    setNdvi(undefined);
  }, [selectedField?.id, selectedPeriod]);

  const registerField = (name) => {
    return new Promise((resolve, reject) => {
      if (!roi || roi?.length < 3) {
        reject("No valid region is specified");
      }
      fetch(`${serverUrl}/register`, {
        headers: {
          "Content-Type": "application/json",
          "Auth-Token": authenticationToken,
        },
        method: "POST",
        body: JSON.stringify({
          name,
          coordinates: roi.map(({ lat, lng }) => [lng, lat]),
        }),
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            setFields((prevFields) => [
              parseField(responseBody),
              ...prevFields,
            ]);
            resolve("Successfully register region of interest");
          } else reject(responseBody["data"]);
        })
        .catch((error) => reject(error.message));
    });
  };

  const unregisterField = () => {
    return new Promise((resolve, reject) => {
      fetch(`${serverUrl}/unregister/${selectedField.id}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "DELETE",
      })
        .then(async (response) => {
          if (response.ok) {
            setFields((prevFields) =>
              prevFields.filter(
                (prevField) => prevField.id !== selectedField.id
              )
            );
            setSelectedField(undefined);
            resolve("Successfully unregister the field");
          } else reject("Failed to unregister the field");
        })
        .catch((error) => reject(error.message));
    });
  };

  const getFieldNdvi = () => {
    return new Promise((resolve, reject) => {
      const field = fields.find((field) => field.id === selectedField.id);
      if (field && selectedPeriod in field?.periodNdvi) {
        setNdvi(field?.periodNdvi[selectedPeriod]);
        resolve("Fetching the field ndvi raster");
      } else {
        fetch(
          `${serverUrl}/process_ndvi/${selectedField.id}/${selectedPeriod}`,
          {
            headers: { "Auth-Token": authenticationToken },
            method: "GET",
          }
        )
          .then(async (response) => {
            const body = await response.json();
            const data = body["data"];
            if (response.ok) {
              const [period, ndviRaster] = data.split("_");
              setFields((prevFields) => {
                const index = prevFields.findIndex(
                  (prevField) => prevField.id === selectedField.id
                );
                if (index !== -1) {
                  prevFields[index].periodNdvi[period] = ndviRaster;
                  return [...prevFields];
                } else return prevFields;
              });
              setNdvi(ndviRaster);
              resolve("Successfully processed. Fetching the field ndvi raster");
            } else reject(data);
          })
          .catch((error) => reject(error.message));
      }
    });
  };

  return (
    <FieldContext.Provider
      value={{
        fields,
        registerField,
        unregisterField,
        selectedField,
        setSelectedField,
        ndvi,
        setNdvi,
        getFieldNdvi,
      }}
    >
      {children}
    </FieldContext.Provider>
  );
}

export function useFieldContext() {
  return useContext(FieldContext);
}
