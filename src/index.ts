import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import axios from "axios";
import request, { gql } from "graphql-request";
import { pin, pinFile } from "./infura";
import * as fs from "fs";

type Project = { metadataUri: string; projectId: string; pv: string };

function listProjects() {
  const query = gql`
    {
      projects(orderBy: projectId, orderDirection: asc, first: 1000) {
        metadataUri
        projectId
        pv
      }
    }
  `;

  return request<{ projects: Project[] }>(
    "https://api.studio.thegraph.com/query/30654/mainnet-dev/0.6.0",
    query
  );
}

function getCachedFilename(project: Project) {
  return `data/${project.projectId}-${project.pv}.json`;
}

function cacheMetadata(project: Project, metadata: any) {
  fs.writeFileSync(
    getCachedFilename(project),
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );
}

function getCachedMetadata(project: Project) {
  const cached = fs.readFileSync(getCachedFilename(project), "utf-8");
  if (cached) return JSON.parse(cached);
}

async function getMetadata(project: Project) {
  const cached = getCachedMetadata(project);
  if (cached) return JSON.parse(cached);

  const { data: metadata } = await axios.get(
    `https://jbx.mypinata.cloud/ipfs/${project.metadataUri}`
  );
  return metadata;
}

async function pinProject(project: Project) {
  console.log("pinning project ID", project.projectId, project.metadataUri);

  try {
    const metadata = await getMetadata(project);
    const pinMetadata = await pinFile(JSON.stringify(metadata));
    console.log(
      "Metadata valid:",
      pinMetadata.data.Hash === project.metadataUri ? "✅" : "❌"
    );

    const logo = metadata.logoUri;
    if (!logo) return;

    console.log("pinning logo", logo);
    const logoHash = metadata.logoUri.startsWith("ipfs://")
      ? logo.split("ipfs://")[1]
      : logo.split("ipfs/")[1];
    await pin(logoHash);

    cacheMetadata(project, metadata);
  } catch (e) {
    console.error((e as any).response?.data ?? e);
  }
}

async function run() {
  const { projects } = await listProjects();

  console.log(projects.length, "projects...");

  projects.reduce(async (fn, project: Project) => {
    return fn.then(() => pinProject(project));
  }, Promise.resolve());
}

run();
