import ReactDOM from "react-dom";
import NotificationProvider from "./contexts/NotificationContext";
import AuthenticationProvider from "./contexts/AuthenticationContext";
import RegionInterestProvider from "./contexts/RegionInterestContext";
import SelectionProvider from "./contexts/SelectionContext";
import FieldProvider from "./contexts/FieldContext";
import NdviRasterProvider from "./contexts/NdviRasterContext";
import MeasurementProvider from "./contexts/MeasurementContext";
import SeasonProvider from "./contexts/SeasonContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <NotificationProvider>
    <AuthenticationProvider>
      <SelectionProvider>
        <RegionInterestProvider>
          <FieldProvider>
            <FieldProvider>
              <NdviRasterProvider>
                <MeasurementProvider>
                  <SeasonProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <App />
                    </LocalizationProvider>
                  </SeasonProvider>
                </MeasurementProvider>
              </NdviRasterProvider>
            </FieldProvider>
          </FieldProvider>
        </RegionInterestProvider>
      </SelectionProvider>
    </AuthenticationProvider>
  </NotificationProvider>,
  rootElement
);
