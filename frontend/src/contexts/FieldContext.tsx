import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useRegionInterestContext } from "./RegionInterestContext";
import { usePeriodContext } from "./PeriodContext";
import { useNotificationContext } from "./NotificationContext";
import { Field, parseField } from "../types/field";
import { Coordinates } from "../types/coordinate";

type SelectedField = {
  id: number;
  coordinates?: Coordinates;
};

type FieldContextType = {
  fields: Field[] | undefined;
  registerField: (name: string) => Promise<string>;
  unregisterField: () => Promise<string>;
  selectedField: SelectedField | undefined;
  setSelectedField: Dispatch<SetStateAction<SelectedField | undefined>>;
  ndvi: string | undefined;
  setNdvi: (ndvi: string | undefined) => void;
  getFieldNdvi: () => Promise<string>;
};

const FieldContext = createContext<FieldContextType>({
  fields: undefined,
  registerField: (_name: string) => new Promise(() => {}),
  unregisterField: () => new Promise(() => {}),
  selectedField: undefined,
  setSelectedField: () => {},
  ndvi: undefined,
  setNdvi: (_ndvi: string | undefined) => {},
  getFieldNdvi: () => new Promise(() => {}),
});

export default function FieldProvider(props: { children: ReactNode }) {
  const { authenticationToken } = useAuthenticationContext();
  const { roi } = useRegionInterestContext();
  const { selectedPeriod } = usePeriodContext();
  const notify = useNotificationContext();
  const [fields, setFields] = useState<Field[] | undefined>(undefined);
  const [selectedField, setSelectedField] = useState<SelectedField | undefined>(
    undefined
  );
  const [ndvi, setNdvi] = useState<string | undefined>(undefined);
  const serverUrl = process.env.REACT_APP_SERVER_URL + "/field";

  useEffect(() => {
    if (authenticationToken) {
      fetch(serverUrl, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            setFields(
              (responseBody as any[]).map((field) => parseField(field))
            );
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
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

  const registerField = (name: string) => {
    return new Promise<string>((resolve, reject) => {
      if (!roi || roi?.length < 3) {
        reject("No valid region is specified");
        return;
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
              ...(prevFields ?? []),
            ]);
            resolve("Successfully register region of interest");
          } else reject(responseBody["data"]);
        })
        .catch((error) => reject(error.message));
    });
  };

  const unregisterField = () => {
    return new Promise<string>((resolve, reject) => {
      fetch(`${serverUrl}/unregister/${selectedField?.id}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "DELETE",
      })
        .then(async (response) => {
          if (response.ok) {
            setFields((prevFields) =>
              prevFields?.filter(
                (prevField) => prevField.id !== selectedField?.id
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
    return new Promise<string>((resolve, reject) => {
      const field = fields?.find((field) => field.id === selectedField?.id);
      if (field && selectedPeriod && selectedPeriod in field?.periodNdvi) {
        setNdvi(field?.periodNdvi[selectedPeriod]);
        resolve("Fetching the field ndvi raster");
      } else {
        fetch(
          `${serverUrl}/process_ndvi/${selectedField?.id}/${selectedPeriod}`,
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
                if (prevFields) {
                  const index = prevFields.findIndex(
                    (prevField) => prevField.id === selectedField?.id
                  );
                  if (index !== -1) {
                    prevFields[index].periodNdvi[period] = ndviRaster;
                    return [...prevFields];
                  }
                }
                return prevFields;
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
      {props.children}
    </FieldContext.Provider>
  );
}

export function useFieldContext() {
  return useContext(FieldContext);
}
