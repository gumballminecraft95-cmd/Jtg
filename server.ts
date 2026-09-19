import { spawn } from "child_process";
import path from "path";
import fs from "fs-extra";
import { panelEvents } from "../events.js";

const DATA_DIR = path.join(process.cwd(), ".data");
const SERVERS_DIR = path.join(DATA_DIR, "servers");

const activeProcesses = new Map();
const serverLogs = new Map();

export async function startLocalServer(serverId, scriptType = "node", mainFile = "index.js") {
    const serverPath = path.join(SERVERS_DIR, serverId);
    const targetFile = path.join(serverPath, mainFile);

    if (activeProcesses.has(serverId)) {
        return { success: true, message: "Process is already running" };
    }

    if (!await fs.pathExists(targetFile)) {
        throw new Error(`Main file not found: ${mainFile}`);
    }

    let customEnv = { ...process.env, FORCE_COLOR: "true" };
    const envFilePath = path.join(serverPath, ".env");
    if (await fs.pathExists(envFilePath)) {
        try {
            const envContent = await fs.readFile(envFilePath, "utf8");
            envContent.split("\n").forEach(line => {
                const parts = line.split("=");
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
                    if (key && !key.startsWith("#")) {
                        customEnv[key] = value;
                    }
                }
            });
        } catch (e) {
            console.error(`[JTG] Failed to parse .env for server ${serverId}`, e);
        }
    }

    const runtime = scriptType === "python" ? "python3" : "node";

    const proc = spawn(runtime, [targetFile], {
        cwd: serverPath,
        shell: true,
        env: customEnv
    });

    activeProcesses.set(serverId, proc);
    if (!serverLogs.has(serverId)) {
        serverLogs.set(serverId, "");
    }

    const appendLog = (data) => {
        const text = data.toString();
        const current = serverLogs.get(serverId) || "";
        serverLogs.set(serverId, current + text);
        panelEvents.emit("log", serverId, text);
    };

    proc.stdout.on("data", appendLog);
    proc.stderr.on("data", appendLog);

    proc.on("close", (code) => {
        const exitMsg = `\n[JTG SYSTEM] Process terminated (Exit Code: ${code})\n`;
        appendLog(exitMsg);
        activeProcesses.delete(serverId);
    });

    return { success: true, pid: proc.pid };
}

export async function stopLocalServer(serverId) {
    const proc = activeProcesses.get(serverId);
    if (proc) {
        try {
            proc.kill("SIGKILL");
        } catch (e) {
            console.error(e);
        }
        activeProcesses.delete(serverId);
        panelEvents.emit("log", serverId, "\n[JTG SYSTEM] Server forcefully stopped by user.\n");
        return { success: true };
    }
    return { success: false, error: "Process is not running" };
}

export async function getLocalServerLogs(serverId) {
    return serverLogs.get(serverId) || "";
}
