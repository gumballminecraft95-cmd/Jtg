import { startLocalServer, stopLocalServer, getLocalServerLogs } from "./local.js";
import path from "path";
import fs from "fs-extra";

const DATA_DIR = path.join(process.cwd(), ".data");

export async function createContainer(serverData: any): Promise<string> {
    const localId = `local-${Date.now()}`;
    return localId;
}

export async function startContainer(containerId: string, serverId: string): Promise<any> {
    try {
        const serversFile = path.join(DATA_DIR, "servers.json");
        const servers = await fs.readJson(serversFile);
        const server = Array.isArray(servers) ? servers.find((s: any) => s.id === serverId) : null;
        
        const scriptType = server?.type || "node";
        const mainFile = server?.mainFile || "index.js";

        return await startLocalServer(serverId, scriptType, mainFile);
    } catch (e) {
        return await startLocalServer(serverId, "node", "index.js");
    }
}

export async function stopContainer(containerId: string, serverId: string): Promise<any> {
    return await stopLocalServer(serverId);
}

export async function getContainerLogs(containerId: string, serverId?: string): Promise<string> {
    if (serverId) return await getLocalServerLogs(serverId);
    return "";
}

export async function attachContainerSocket(containerId: string, serverId: string): Promise<boolean> {
    return true;
}

export async function removeContainer(containerId: string): Promise<boolean> {
    return true;
}
