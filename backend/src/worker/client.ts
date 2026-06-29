import axios from "axios";

export const worker = axios.create({
  baseURL: process.env.WORKER_URL,
});
