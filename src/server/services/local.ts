import fs from "fs-extra";
import path from "path";
import { spawn, ChildProcess, exec } from "child_process";
import { promisify } from "util";
import { panelEvents } from "../events.js";

const execAsync = promisify(exec);
const processes = new Map<string, ChildProcess>();
const localStartedAt = new Map<string, string>();
const activeStreams = new Set<string>();

const DATA_DIR = path.join(process.cwd(), ".data");
const SERVERS_DIR = path.join(DATA_DIR, "servers");
const serverLogs = new Map<string, string>();

export async function resolveJavaBinary(targetJavaVersion?: string): Promise<string | null> {
    if (process.env.JAVA_BIN && await fs.pathExists(process.env.JAVA_BIN)) {
        return process.env.JAVA_BIN;
    }
    const versionSpecificCandidates: string[] = [];
    if (targetJavaVersion) {
        versionSpecificCandidates.push(
            `/usr/lib/jvm/java-${targetJavaVersion}-openjdk-amd64/bin/java`,
            `/usr/lib/jvm/java-${targetJavaVersion}-openjdk-arm64/bin/java`,
            `/usr/lib/jvm/java-${targetJavaVersion}-openjdk/bin/java`,
            `/usr/lib/jvm/temurin-${targetJavaVersion}-jdk-amd64/bin/java`,
            `/opt/java/openjdk-${targetJavaVersion}/bin/java`,
            `/opt/jdk-${targetJavaVersion}/bin/java`
        );
    }
    for (const cand of versionSpecificCandidates) {
        if (await fs.pathExists(cand)) {
            return cand;
        }
    }
    return "java";
}

export async function createLocalServer(serverData: any): Promise<string> {
    const serverId = serverData?.id || `local-${Date.now()}`;
    const serverPath = path.join(SERVERS_DIR, serverId);
    await fs.ensureDir(serverPath);
    return serverId;
}

export async function startLocalServer(serverId: string, scriptType = "node", mainFile = "index.js", javaVersion?: string, memory?: string) {
    const serverPath = path.join(SERVERS_DIR, serverId);
    const targetFile = path.join(serverPath, mainFile);

    if (processes.has(serverId)) {
        return { success: true, message: "Process is already running" };
    }

    if (!await fs.pathExists(targetFile) && scriptType !== "minecraft") {
        throw new Error(`Main file not found: ${mainFile}`);
    }

    let customEnv: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: "true" };
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

    let command = "";
    let args: string[] = [];

    if (scriptType === "python") {
        command = "python3";
        args = [targetFile];
    } else if (scriptType === "minecraft") {
        const javaBin = await resolveJavaBinary(javaVersion);
        const xmx = memory || "2G";
        command = javaBin || "java";
        args = [`-Xmx${xmx}`, `-Xms${xmx}`, `-jar`, mainFile];
    } else {
        command = "node";
        args = [targetFile];
    }

    const proc = spawn(command, args, {
        cwd: serverPath,
        shell: true,
        env: customEnv
    });

    processes.set(serverId, proc);
    localStartedAt.set(serverId, new Date().toISOString());

    if (!serverLogs.has(serverId)) {
        serverLogs.set(serverId, "");
    }

    const appendLog = (data: Buffer) => {
        const text = data.toString();
        const current = serverLogs.get(serverId) || "";
        serverLogs.set(serverId, current + text);
        panelEvents.emit("log", serverId, text);
    };

    if (proc.stdout) proc.stdout.on("data", appendLog);
    if (proc.stderr) proc.stderr.on("data", appendLog);

    proc.on("close", (code) => {
        const exitMsg = `\n[JTG SYSTEM] Process terminated (Exit Code: ${code})\n`;
        appendLog(Buffer.from(exitMsg));
        processes.delete(serverId);
        localStartedAt.delete(serverId);
    });

    return { success: true, pid: proc.pid };
}

export async function stopLocalServer(serverId: string) {
    const proc = processes.get(serverId);
    if (proc) {
        try {
            proc.kill("SIGKILL");
        } catch (e) {
            console.error(e);
        }
        processes.delete(serverId);
        localStartedAt.delete(serverId);
        panelEvents.emit("log", serverId, "\n[JTG SYSTEM] Server forcefully stopped by user.\n");
        return { success: true };
    }
    return { success: false, error: "Process is not running" };
}

export async function killLocalServer(serverId: string) {
    return await stopLocalServer(serverId);
}

export async function restartLocalServer(serverId: string, scriptType = "node", mainFile = "index.js", javaVersion?: string, memory?: string) {
    await stopLocalServer(serverId);
    return await startLocalServer(serverId, scriptType, mainFile, javaVersion, memory);
}

export async function deleteLocalServer(serverId: string) {
    await stopLocalServer(serverId);
    const serverPath = path.join(SERVERS_DIR, serverId);
    if (await fs.pathExists(serverPath)) {
        await fs.remove(serverPath);
    }
    serverLogs.delete(serverId);
    return { success: true };
}

export async function getLocalServerStatus(serverId: string): Promise<string> {
    return processes.has(serverId) ? "running" : "offline";
}

export async function getLocalServerStats(serverId: string): Promise<any> {
    return { cpu: 0, memory: 0 };
}

export async function getLocalServerLogs(serverId: string): Promise<string> {
    return serverLogs.get(serverId) || "";
}
