import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSelectionContext } from "./SelectionContext";
import { Coordinates } from "../types/coordinate";

type FieldContextType = {
  coordinates: Coordinates | undefined;
  setupFieldLayer: (coordinates: Coordinates) => void;
  fieldVisible: boolean;
  toggleFieldVisible: () => void;
};

const FieldContext = createContext<FieldContextType>({
  coordinates: undefined,
  setupFieldLayer: () => {},
  fieldVisible: false,
  toggleFieldVisible: () => {},
});

export default function FieldProvider(props: { children: ReactNode }) {
  const { selectedFieldId } = useSelectionContext();
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(
    undefined
  );
  const [regionVisible, setRegionVisible] = useState(false);

  useEffect(() => {
    if (selectedFieldId === undefined) {
      setRegionVisible(false);
      setCoordinates(undefined);
    }
  }, [selectedFieldId]);

  const setupFieldLayer = (coordinates: Coordinates) => {
    setCoordinates(coordinates);
  };

  const toggleFieldRegion = () => {
    setRegionVisible((prevRegionVisible) => !prevRegionVisible);
  };

  return (
    <FieldContext.Provider
      value={{
        coordinates,
        setupFieldLayer,
        fieldVisible: regionVisible,
        toggleFieldVisible: toggleFieldRegion,
      }}
    >
      {props.children}
    </FieldContext.Provider>
  );
}

export function useFieldContext() {
  return useContext(FieldContext);
}
