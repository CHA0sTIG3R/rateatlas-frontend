import axios, { type AxiosInstance } from "axios";
import type { FilingStatus, HistoryMetric, HistoryPoint, TaxCalculation, TaxInput } from "./types";

const BASE =
    import.meta.env.RATE_ATLAS_API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080/api/v1";

function CreateApi(): AxiosInstance {
    return axios.create({
        baseURL: BASE,
        timeout: 10000,
    });
}

const api = CreateApi();


export async function fetchAvailableYears(): Promise<number[]> {
    const res = await api.get<number[]>("/tax/years");
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
    res.data = res.data.map(point => ({
        ...point,
        value: typeof point.value === "string"
            ? Number((point.value as string).replace("%", ""))
            : point.value
    }));
    return res.data;
}


export async function fetchCalculation(input: TaxInput): Promise<TaxCalculation> {
    const res = await api.post<TaxCalculation>("/tax/breakdown", input);
    return res.data;
}
