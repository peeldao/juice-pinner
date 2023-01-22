import axios from "axios";
var FormData = require("form-data");

const INFURA_IPFS_API_BASE_URL = "https://ipfs.infura.io:5001";
const INFURA_IPFS_PROJECT_ID = process.env.INFURA_IPFS_PROJECT_ID;
const INFURA_IPFS_API_SECRET = process.env.INFURA_IPFS_API_SECRET;

const AUTH_HEADER = `Basic ${Buffer.from(
  `${INFURA_IPFS_PROJECT_ID}:${INFURA_IPFS_API_SECRET}`
).toString("base64")}`;

const infuraApi = axios.create({
  baseURL: INFURA_IPFS_API_BASE_URL,
  headers: {
    Authorization: AUTH_HEADER,
    origin: "https://juicebox.money",
  },
});

export function pin(hash: string) {
  return infuraApi.post(`/api/v0/pin/add?arg=${hash}`);
}

export function pinFile(content: Blob | string, opts?: any) {
  const formData = new FormData();
  formData.append("file", content, opts);

  return infuraApi.post("/api/v0/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
