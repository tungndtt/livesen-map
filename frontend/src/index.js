import ReactDOM from "react-dom";
import NotificationProvider from "./contexts/NotificationContext";
import AuthenticationProvider from "./contexts/AuthenticationContext";
import PeriodProvider from "./contexts/PeriodContext";
import RegionInterestProvider from "./contexts/RegionInterestContext";
import FieldProvider from "./contexts/FieldContext";
import MeasurementProvider from "./contexts/MeasurementContext";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <NotificationProvider>
    <AuthenticationProvider>
      <PeriodProvider>
        <RegionInterestProvider>
          <FieldProvider>
            <MeasurementProvider>
              <App />
            </MeasurementProvider>
          </FieldProvider>
        </RegionInterestProvider>
      </PeriodProvider>
    </AuthenticationProvider>
  </NotificationProvider>,
  rootElement
);
