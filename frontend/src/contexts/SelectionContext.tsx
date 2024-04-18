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
  selectedFieldId: number | undefined;
  setSelectedFieldId: Dispatch<SetStateAction<number | undefined>>;
  seasonOptions: SeasonOption[] | undefined;
  selectedSeasonId: string | undefined;
  setSelectedSeasonId: Dispatch<SetStateAction<string | undefined>>;
  onFieldEvent: (action: string, payload: any) => void;
  onSeasonEvent: (action: string, payload: any) => void;
};

const SelectionContext = createContext<SelectionContextType>({
  fieldOptions: undefined,
  selectedFieldId: undefined,
  setSelectedFieldId: () => {},
  seasonOptions: undefined,
  selectedSeasonId: undefined,
  setSelectedSeasonId: () => {},
  onFieldEvent: () => {},
  onSeasonEvent: () => {},
});

const formulateSeasonDate = (seasonId: string) => {
  const [year, month, day] = seasonId.split("-");
  return `${day}-${month}-${year}`;
};

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

  useEffect(() => {
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
  }, [authenticationToken]);

  const fetchSeasonOptions = () => {
    const reset = () => {
      setSeasonOptions(undefined);
      setSelectedSeasonId(undefined);
    };
    if (selectedFieldId) {
      doRequest(`season/${selectedFieldId}`, "GET")
        .then(async (response) => {
          const responseBody = await response.json();
          const seasonOptions = (responseBody as string[]).map((e) => {
            return { id: e, label: formulateSeasonDate(e) };
          }) as SeasonOption[];
          setSeasonOptions(seasonOptions);
          if (!seasonOptions.find(({ id }) => id === selectedSeasonId)) {
            setSelectedSeasonId(undefined);
          }
        })
        .catch(reset);
    } else reset();
  };

  useEffect(fetchSeasonOptions, [selectedFieldId]);

  const onFieldEvent = (action: string, payload: any) => {
    const { id, name } = payload;
    switch (action) {
      case "create": {
        setFieldOptions((prevFieldOptions) => {
          if (
            !prevFieldOptions?.find(
              (prevFieldOptions) => prevFieldOptions.id === id
            )
          ) {
            prevFieldOptions = [{ id, name }, ...(prevFieldOptions ?? [])];
          }
          return prevFieldOptions;
        });
        break;
      }
      case "delete": {
        setFieldOptions((prevFieldOptions) => {
          if (
            prevFieldOptions?.find(
              (prevFieldOptions) => prevFieldOptions.id === id
            )
          ) {
            prevFieldOptions = prevFieldOptions?.filter(
              (prevFieldOptions) => prevFieldOptions.id !== id
            );
            if (selectedFieldId === id) setSelectedFieldId(undefined);
          }
          return prevFieldOptions;
        });
        break;
      }
    }
  };

  const onSeasonEvent = (action: string, payload: any) => {
    const { field_id: fieldId, season_id: seasonId } = payload;
    if (selectedFieldId !== fieldId) return;
    switch (action) {
      case "create": {
        setSeasonOptions((prevSeasonOptions) => {
          if (
            !prevSeasonOptions?.find(
              (prevSeasonOptions) => prevSeasonOptions.id === seasonId
            )
          ) {
            prevSeasonOptions = [
              { id: seasonId, label: formulateSeasonDate(seasonId) },
              ...(prevSeasonOptions ?? []),
            ];
          }
          return prevSeasonOptions;
        });
        break;
      }
      case "delete": {
        setSeasonOptions((prevSeasonOptions) => {
          if (
            prevSeasonOptions?.find(
              (prevSeasonOptions) => prevSeasonOptions.id === seasonId
            )
          ) {
            prevSeasonOptions = prevSeasonOptions?.filter(
              (prevSeasonOptions) => prevSeasonOptions.id !== seasonId
            );
            if (selectedSeasonId === seasonId) setSelectedSeasonId(undefined);
          }
          return prevSeasonOptions;
        });
        break;
      }
    }
  };

  return (
    <SelectionContext.Provider
      value={{
        fieldOptions,
        selectedFieldId,
        setSelectedFieldId,
        seasonOptions,
        selectedSeasonId,
        setSelectedSeasonId,
        onFieldEvent,
        onSeasonEvent,
      }}
    >
      {props.children}
    </SelectionContext.Provider>
  );
}

export function useSelectionContext() {
  return useContext(SelectionContext);
}
