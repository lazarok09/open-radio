import { EventEmitter } from "node:events";
export const stationEvents = new EventEmitter();
export const STATION_CHANGED = "station.changed";
export const publishStationChanged = () => stationEvents.emit(STATION_CHANGED);
