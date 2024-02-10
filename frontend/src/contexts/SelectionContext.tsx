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
  const { authenticationToken, doRequest } = useAuthenticationContext();
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

  const refreshFieldOptions = () => {
    if (authenticationToken) {
      doRequest("field", "GET")
        .then(async (response) => {
          const responseBody = await response.json();
          const fieldOptions = responseBody as FieldOption[];
          setFieldOptions(fieldOptions);
          if (!fieldOptions.find(({ id }) => id === selectedFieldId)) {
            setSelectedFieldId(undefined);
          }
        })
        .catch(() => {});
    } else {
      setFieldOptions(undefined);
      setSelectedFieldId(undefined);
    }
  };

  useEffect(refreshFieldOptions, [authenticationToken]);

  const refreshSeasonOptions = () => {
    const reset = () => {
      setSeasonOptions(undefined);
      setSelectedSeasonId(undefined);
    };
    if (selectedFieldId) {
      doRequest(`season/${selectedFieldId}`, "GET")
        .then(async (response) => {
          const responseBody = await response.json();
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
        })
        .catch(reset);
    } else reset();
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
