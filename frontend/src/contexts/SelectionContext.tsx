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
import { useNotificationContext } from "./NotificationContext";

type FieldOption = {
  id: number;
  name: string;
};

type SeasonOption = {
  id: string;
  label: string;
};

type SelectionContextType = {
  fieldOptions: FieldOption[] | undefined;
  refreshFieldOptions: () => void;
  selectedFieldId: number | undefined;
  setSelectedFieldId: Dispatch<SetStateAction<number | undefined>>;
  seasonOptions: SeasonOption[] | undefined;
  refreshSeasonOptions: () => void;
  selectedSeasonId: string | undefined;
  setSelectedSeasonId: Dispatch<SetStateAction<string | undefined>>;
};

const SelectionContext = createContext<SelectionContextType>({
  fieldOptions: undefined,
  refreshFieldOptions: () => {},
  selectedFieldId: undefined,
  setSelectedFieldId: () => {},
  seasonOptions: undefined,
  refreshSeasonOptions: () => {},
  selectedSeasonId: undefined,
  setSelectedSeasonId: () => {},
});

export default function SelectionProvider(props: { children: ReactNode }) {
  const { authenticationToken } = useAuthenticationContext();
  const notify = useNotificationContext();
  const [fieldOptions, setFieldOptions] = useState<FieldOption[] | undefined>(
    undefined
  );
  const [selectedFieldId, setSelectedFieldId] = useState<number | undefined>(
    undefined
  );
  const [seasonOptions, setSeasonOptions] = useState<
    SeasonOption[] | undefined
  >(undefined);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(
    undefined
  );
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const refreshFieldOptions = () => {
    if (authenticationToken) {
      fetch(`${serverUrl}/field`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            const fieldOptions = responseBody as FieldOption[];
            setFieldOptions(fieldOptions);
            if (!fieldOptions.find(({ id }) => id === selectedFieldId)) {
              setSelectedFieldId(undefined);
            }
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => notify({ message: error.message, isError: true }));
    } else {
      setFieldOptions(undefined);
      setSelectedFieldId(undefined);
    }
  };

  useEffect(refreshFieldOptions, [authenticationToken]);

  const refreshSeasonOptions = () => {
    if (authenticationToken && selectedFieldId) {
      fetch(`${serverUrl}/season/${selectedFieldId}`, {
        headers: { "Auth-Token": authenticationToken },
        method: "GET",
      })
        .then(async (response) => {
          const responseBody = await response.json();
          if (response.ok) {
            const seasonOptions = (responseBody as string[]).map((e) => {
              const year = e.substring(0, 4);
              const month = e.substring(4, 6);
              const day = e.substring(6);
              return { id: e, label: `${day}-${month}-${year}` };
            }) as SeasonOption[];
            setSeasonOptions(seasonOptions);
            if (!seasonOptions.find(({ id }) => id === selectedSeasonId)) {
              setSelectedSeasonId(undefined);
            }
          } else {
            notify({ message: responseBody["data"], isError: true });
          }
        })
        .catch((error) => {
          notify({ message: error.message, isError: true });
        });
    } else {
      setSeasonOptions(undefined);
      setSelectedSeasonId(undefined);
    }
  };

  useEffect(refreshSeasonOptions, [authenticationToken, selectedFieldId]);

  return (
    <SelectionContext.Provider
      value={{
        fieldOptions,
        refreshFieldOptions,
        selectedFieldId,
        setSelectedFieldId,
        seasonOptions,
        refreshSeasonOptions,
        selectedSeasonId,
        setSelectedSeasonId,
      }}
    >
      {props.children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext() {
  return useContext(SelectionContext);
}
