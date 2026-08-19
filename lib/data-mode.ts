export type DataMode = "demo" | "live";

export function getDataMode(): DataMode {
  return process.env.DATA_MODE === "live" ? "live" : "demo";
}

export function isLiveConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}
