import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 120000,
});

export async function extractInvoice(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/extract", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getHistory() {
  const { data } = await api.get("/history");
  return data;
}

export async function getHealth() {
  const { data } = await api.get("/health");
  return data;
}
