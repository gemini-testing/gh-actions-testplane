import core from "@actions/core";
import exec, { type ExecOptions } from "@actions/exec";
import { INPUT } from "./constants.js";

export const PackageManagerEnum = {
    NPM: "npm",
    PNPM: "pnpm",
    YARN: "yarn",
} as const;

export type PackageManager = (typeof PackageManagerEnum)[keyof typeof PackageManagerEnum];

type ExecOptionsExtended = ExecOptions & {
    /** optional. defaults to true */
    canThrow?: boolean;
};

const prepareOpts = (opts?: ExecOptionsExtended): ExecOptionsExtended => {
    return {
        ...(opts || {}),
        silent: opts?.silent ?? true,
        canThrow: opts?.canThrow ?? true,
        ignoreReturnCode: true,
        cwd: core.getInput(INPUT.CWD),
        env: { CI: "true", ...process.env, ...(opts?.env || {}) },
    };
};

export class PackageManagerRunner {
    constructor(private packageManager: PackageManager) {
        if (!Object.values(PackageManagerEnum).includes(packageManager)) {
            throw new Error(
                [
                    `Package manager "${packageManager}" is not supported.`,
                    `Supported values: ${Object.values(PackageManagerEnum)
                        .map((value) => `"${value}"`)
                        .join(" ")}`,
                ].join("\n"),
            );
        }
    }

    public async exec(commandWithArgs: string[], opts?: ExecOptionsExtended): Promise<number> {
        const argsPrepared = this.prepareArgs(commandWithArgs);
        const optsPrepared = prepareOpts(opts);

        core.debug(`Running "${this.packageManager} ${argsPrepared.join(" ")}"`);

        const exitCode = await exec.exec(this.packageManager, argsPrepared, optsPrepared);

        if (exitCode && optsPrepared.canThrow) {
            throw new Error(`Command "${commandWithArgs.join(" ")}" failed with exit code ${exitCode}`);
        }

        return exitCode;
    }

    public async getExecOutput(commandWithArgs: string[], opts?: ExecOptionsExtended): Promise<string> {
        const argsPrepared = this.prepareArgs(commandWithArgs);
        const optsPrepared = prepareOpts(opts);

        core.debug(`Running "${this.packageManager} ${argsPrepared.join(" ")}"`);

        const execResult = await exec.getExecOutput(this.packageManager, argsPrepared, optsPrepared);

        if (execResult.exitCode && optsPrepared.canThrow) {
            throw new Error(
                [
                    `Command "${commandWithArgs.join(" ")}" failed with exit code ${execResult.exitCode}. Stderr:`,
                    execResult.stderr,
                ].join("\n"),
            );
        }

        return execResult.stdout.trim();
    }

    private prepareArgs(commandWithArgs: string[]) {
        const args = ["exec"];

        switch (this.packageManager) {
            case PackageManagerEnum.NPM:
                return args.concat(["--no-install", "--"], commandWithArgs);
            case PackageManagerEnum.PNPM:
            case PackageManagerEnum.YARN:
                return args.concat(commandWithArgs);
        }
    }
}
