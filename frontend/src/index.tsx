import ReactDOM from "react-dom";
import ResizeProvider from "./contexts/ResizeContext";
import NotificationProvider from "./contexts/NotificationContext";
import AuthenticationProvider from "./contexts/AuthenticationContext";
import MetadataProvider from "./contexts/MetadataContext";
import RegionInterestProvider from "./contexts/RegionInterestContext";
import SelectionProvider from "./contexts/SelectionContext";
import FieldProvider from "./contexts/FieldContext";
import NdviRasterProvider from "./contexts/NdviRasterContext";
import MeasurementProvider from "./contexts/MeasurementContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <ResizeProvider>
    <NotificationProvider>
      <AuthenticationProvider>
        <MetadataProvider>
          <SelectionProvider>
            <RegionInterestProvider>
              <FieldProvider>
                <NdviRasterProvider>
                  <MeasurementProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <App />
                    </LocalizationProvider>
                  </MeasurementProvider>
                </NdviRasterProvider>
              </FieldProvider>
            </RegionInterestProvider>
          </SelectionProvider>
        </MetadataProvider>
      </AuthenticationProvider>
    </NotificationProvider>
  </ResizeProvider>,
  rootElement
);
