import axios, { type AxiosInstance } from "axios";
import type { FilingStatus, HistoryMetric, HistoryPoint, TaxCalculation, TaxInput } from "./types";

const BASE =
    import.meta.env.RATE_ATLAS_API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080/api/v1";
console.log("API base URL:", BASE);

function CreateApi(): AxiosInstance {
    return axios.create({
        baseURL: BASE,
        timeout: 10000,
    });
}

const api = CreateApi();
console.log("Axios instance created with base URL:", api.defaults.baseURL);


export async function fetchAvailableYears(): Promise<number[]> {
    const res = await api.get<number[]>("/tax/years");
    console.log("Fetched available years:", res.data);
    return res.data;
}


export async function fetchHistory(
    status: FilingStatus,
    metric: HistoryMetric,
    startYear: number,
    endYear: number
): Promise<HistoryPoint[]> {
    const res = await api.get<HistoryPoint[]>("/tax/history", {
        params: { status, metric, startYear, endYear },
    });
    console.log("Fetched history data:", res.data);
    res.data = res.data.map(point => ({
        ...point,
        value: typeof point.value === "string"
            ? Number((point.value as string).replace("%", ""))
            : point.value
    }));
    console.log("Processed history data:", res.data);
    return res.data;
}


export async function fetchCalculation(input: TaxInput): Promise<TaxCalculation> {
    console.log("Sending API request with input:", input);
    const res = await api.post<TaxCalculation>("/tax/breakdown", input);
    console.log("API response:", res.data);
    return res.data;
}
