import { jest, expect } from "@jest/globals";
import core from "@actions/core";
import exec from "@actions/exec";
import { PackageManagerRunner, PackageManagerEnum } from "./package-manager-runner.js";

jest.mock("@actions/core");
jest.mock("@actions/exec", () => ({ exec: jest.fn(), getExecOutput: jest.fn() }));

describe("PackageManagerRunner", () => {
    const mockExec = jest.mocked(exec.exec);
    const mockGetExecOutput = jest.mocked(exec.getExecOutput);
    const mockDebug = jest.mocked(core.debug);

    describe("constructor", () => {
        it("should throw an error when an unsupported package manager is provided", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(() => new PackageManagerRunner("unsupported" as any)).toThrow(
                'Package manager "unsupported" is not supported.',
            );
        });

        it("should not throw an error when a supported package manager is provided", () => {
            new PackageManagerRunner(PackageManagerEnum.NPM);
            new PackageManagerRunner(PackageManagerEnum.PNPM);
            new PackageManagerRunner(PackageManagerEnum.YARN);
        });
    });

    describe("exec", () => {
        it("should execute a command with correct arguments", async () => {
            const runner = new PackageManagerRunner(PackageManagerEnum.NPM);
            mockExec.mockResolvedValue(0);

            await runner.exec(["test"]);

            expect(mockExec).toHaveBeenCalledWith(
                "npm",
                ["exec", "--no-install", "--", "test"],
                expect.objectContaining({ silent: true }),
            );
            expect(mockDebug).toHaveBeenCalledWith('Running "npm exec --no-install -- test"');
        });

        it("should throw an error when the command fails", async () => {
            const runner = new PackageManagerRunner(PackageManagerEnum.NPM);
            mockExec.mockResolvedValue(1);

            await expect(runner.exec(["failCommand", "--some-arg"])).rejects.toThrow(
                'Command "failCommand --some-arg" failed with exit code 1',
            );
        });

        it("should not throw an error when the command fails but canThrow is false", async () => {
            const runner = new PackageManagerRunner(PackageManagerEnum.PNPM);
            mockExec.mockResolvedValue(1);

            const exitCode = await runner.exec(["failCommand"], { canThrow: false });
            expect(exitCode).toBe(1);
        });
    });

    describe("getExecOutput", () => {
        it("should return stdout of a successful command", async () => {
            const runner = new PackageManagerRunner(PackageManagerEnum.YARN);
            mockGetExecOutput.mockResolvedValue({ stdout: "output", stderr: "", exitCode: 0 });

            const output = await runner.getExecOutput(["test"]);
            expect(output).toBe("output");
        });

        it("should throw an error when the command fails", async () => {
            const runner = new PackageManagerRunner(PackageManagerEnum.NPM);
            mockGetExecOutput.mockResolvedValue({ stdout: "", stderr: "error", exitCode: 1 });

            await expect(runner.getExecOutput(["failCommand", "--some-arg"], { canThrow: true })).rejects.toThrow(
                'Command "failCommand --some-arg" failed with exit code 1. Stderr:\nerror',
            );
        });
    });
});
