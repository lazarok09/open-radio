import { musicProvider } from "./provider";
export async function searchProviderTracks(query: string) { return musicProvider.search(query); }
export async function getProviderTrack(id: string) { return musicProvider.getTrack(id); }
