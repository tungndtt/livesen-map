import { ReactNode, useEffect, useRef } from "react";
import { useAuthenticationContext } from "./AuthenticationContext";
import { useProfileContext } from "./ProfileContext";
import { useSelectionContext } from "./SelectionContext";
import { useFieldContext } from "./FieldContext";
import { useSeasonContext } from "./SeasonContext";
import { useMeasurementContext } from "./MeasurementContext";

export default function EventProvider(props: { children: ReactNode }) {
  const { authenticationToken } = useAuthenticationContext();
  const {
    selectedFieldId,
    selectedSeasonId,
    onFieldEvent: onFieldSelectionEvent,
    onSeasonEvent: onSeasonSelectionEvent,
  } = useSelectionContext();
  const { onEvent: onProfileEvent } = useProfileContext();
  const { onEvent: onFieldEvent } = useFieldContext();
  const { onEvent: onSeasonEvent } = useSeasonContext();
  const { onEvent: onMeasurementEvent } = useMeasurementContext();
  const eventListener = useRef<EventSource | null>(null);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL;
    if (authenticationToken) {
      if (!eventListener.current) {
        eventListener.current = new EventSource(
          `${serverUrl}/sse?auth_token=${authenticationToken}`
        );
      }
      eventListener.current.onmessage = function (event) {
        const { type, payload } = JSON.parse(event.data);
        const [name, action] = type.split(".");
        switch (name) {
          case "field": {
            onFieldSelectionEvent(action, payload);
            onFieldEvent(action, payload);
            break;
          }
          case "season": {
            onSeasonSelectionEvent(action, payload);
            onSeasonEvent(action, payload);
            break;
          }
          case "measurement": {
            onMeasurementEvent(action, payload);
            break;
          }
          case "user": {
            onProfileEvent(action, payload);
            break;
          }
        }
      };
    } else if (eventListener.current) {
      eventListener.current.close();
      eventListener.current = null;
    }
    return () => {
      if (eventListener.current) {
        eventListener.current.close();
        eventListener.current = null;
      }
    };
  }, [authenticationToken, selectedFieldId, selectedSeasonId]);

  return <>{props.children}</>;
}
