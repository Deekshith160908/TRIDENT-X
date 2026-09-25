import axios from "axios";
import { ScanRecord } from "../shared/schema";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const analyzeUrl = async (url: string): Promise<ScanRecord> => {
  const response = await api.post<ScanRecord>("/analyze", { url });
  return response.data;
};

export const getRecentScans = async (): Promise<ScanRecord[]> => {
  const response = await api.get<ScanRecord[]>("/scans");
  return response.data;
};
