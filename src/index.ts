import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import axios from "axios";
import request, { gql } from "graphql-request";
import { pin, pinFile } from "./infura";

type Project = { metadataUri: string; projectId: string };

function listProjects() {
  const query = gql`
    {
      projects(orderBy: projectId, orderDirection: asc, first: 1000) {
        metadataUri
        projectId
      }
    }
  `;

  return request<{ projects: Project[] }>(
    "https://api.studio.thegraph.com/query/30654/mainnet-dev/0.6.0",
    query
  );
}

async function pinProject(project: Project) {
  console.log("pinning project ID", project.projectId, project.metadataUri);

  try {
    const { data: metadata } = await axios.get(
      `https://jbx.mypinata.cloud/ipfs/${project.metadataUri}`
    );
    const pinMetadata = await pinFile(JSON.stringify(metadata));
    console.log(
      pinMetadata.data.Hash === project.metadataUri,
      "validate metadata"
    );

    const logo = metadata.logoUri;
    if (!logo) return;

    console.log("pinning logo", logo);
    await pin(logo.split("ipfs/")[1]);
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
