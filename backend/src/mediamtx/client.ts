import axios from "axios";

const mediamtx = axios.create({
  baseURL: process.env.MEDIAMTX_API_URL,
  auth: {
    username: process.env.MEDIAMTX_API_USERNAME!,
    password: process.env.MEDIAMTX_API_PASSWORD!,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

export const startStream = async (path: string, source: string) => {
  try {
    await mediamtx.post(`/v3/config/paths/add/${path}`, {
      source,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
    }
    throw error;
  }
};

export const stopStream = async (path: string) => {
  try {
    await mediamtx.delete(`/v3/config/paths/delete/${path}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error.response?.data);
    }
    throw error;
  }
};
