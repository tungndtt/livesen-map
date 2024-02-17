import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useNotificationContext } from "./NotificationContext";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useSelectionContext } from "./SelectionContext";
import { useRegionInterestContext } from "./RegionInterestContext";
import { Field, parseField } from "../types/field";

type FieldContextType = {
  field: Field | undefined;
  registerField: () => void;
  unregisterField: () => void;
  fieldVisible: boolean;
  toggleFieldVisible: () => void;
  onEvent: (action: string, payload: any) => void;
};

const FieldContext = createContext<FieldContextType>({
  field: undefined,
  registerField: () => {},
  unregisterField: () => {},
  fieldVisible: false,
  toggleFieldVisible: () => {},
  onEvent: () => {},
});

export default function FieldProvider(props: { children: ReactNode }) {
  const notify = useNotificationContext();
  const { doRequest } = useAuthenticationContext();
  const { selectedFieldId } = useSelectionContext();
  const { roi, setRoi, roiName, setRoiName } = useRegionInterestContext();
  const [fieldVisible, setFieldVisible] = useState(false);
  const [field, setField] = useState<Field | undefined>(undefined);

  useEffect(() => {
    if (selectedFieldId) {
      doRequest(`field/${selectedFieldId}`, "GET")
        .then(async (response) => {
          const responseBody = await response.json();
          const field = parseField(responseBody);
          setField(field);
        })
        .catch((error) => {
          setField(undefined);
          notify({ message: error, isError: true });
        });
    } else setField(undefined);
  }, [selectedFieldId]);

  useEffect(() => {
    if (selectedFieldId === undefined) setFieldVisible(false);
  }, [selectedFieldId]);

  const registerField = () => {
    if (roi && roiName) {
      doRequest("field/register", "POST", {
        name: roiName,
        coordinates: roi.map((r) => r.map(({ lat, lng }) => [lng, lat])),
      })
        .then(() => {
          setRoi(undefined);
          setRoiName("");
          notify({
            message: "Successfully register region of interest",
            isError: false,
          });
        })
        .catch((error) => notify({ message: error, isError: true }));
    }
  };

  const unregisterField = () => {
    doRequest(`field/unregister/${selectedFieldId}`, "DELETE")
      .then(() => {
        notify({
          message: "Successfully unregister the field",
          isError: false,
        });
      })
      .catch(() => {
        notify({ message: "Failed to unregister the field", isError: true });
      });
  };

  const toggleFieldVisible = () => {
    setFieldVisible((prevRegionVisible) => !prevRegionVisible);
  };

  const onEvent = (action: string, payload: any) => {
    if (action === "delete" && payload?.id === field?.id) setField(undefined);
  };

  return (
    <FieldContext.Provider
      value={{
        field,
        registerField,
        unregisterField,
        fieldVisible,
        toggleFieldVisible,
        onEvent,
      }}
    >
      {props.children}
    </FieldContext.Provider>
  );
}

export function useFieldContext() {
  return useContext(FieldContext);
}
