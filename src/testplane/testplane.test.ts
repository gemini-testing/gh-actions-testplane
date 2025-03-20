import { jest, expect } from "@jest/globals";
import { Testplane } from "./testplane.js";
import { INPUT, OUTPUT } from "../constants";
import core from "@actions/core";
import { existsSync, promises as fsPromises } from "node:fs";
import { TestplaneConfig } from "./config";
import { getHtmlReporterOverrideReportPathEnv } from "../env";
import { groupTestsByFullTitle, getRootRelativePath } from "../utils";
import type { PackageManagerRunner } from "../package-manager-runner";

jest.mock("@actions/core");
jest.mock("node:fs", () => ({
    promises: { readFile: jest.fn() },
    existsSync: jest.fn(),
}));
jest.mock("./config");
jest.mock("../utils", () => ({
    getRootRelativePath: jest.fn((cwdRelativePath: string) => `cwd/${cwdRelativePath}`),
    getCwdRelativePath: jest.fn((rootRelativePath: string) => `../${rootRelativePath}`),
    groupTestsByFullTitle: jest.fn(),
}));
jest.mock("../env", () => ({
    getHtmlReporterOverrideReportPathEnv: jest.fn(() => ({
        html_reporter_path: "testplane-reports/2025-01-01/12819471512/1",
    })),
}));

describe("Testplane", () => {
    let packageManagerRunnerMock: jest.Mocked<PackageManagerRunner>;
    let testplane: Testplane;

    beforeEach(() => {
        packageManagerRunnerMock = {
            getExecOutput: jest.fn(),
            exec: jest.fn(),
        } as unknown as jest.Mocked<PackageManagerRunner>;

        testplane = new Testplane(packageManagerRunnerMock, "configPath");
    });

    describe("version", () => {
        it("should return parsed version", async () => {
            packageManagerRunnerMock.getExecOutput.mockResolvedValue("1.2.3");
            const result = await testplane.version();
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("listBrowsers", () => {
        it("should return the list of browsers", async () => {
            packageManagerRunnerMock.getExecOutput.mockResolvedValue("Chrome\nFirefox");
            const result = await testplane.listBrowsers();
            expect(result).toBe("Chrome\nFirefox");
        });
    });

    describe("config", () => {
        it("should return parsed Testplane config", async () => {
            const configJson = JSON.stringify({ someKey: "someValue" });
            packageManagerRunnerMock.getExecOutput.mockResolvedValue(configJson);

            const result = await testplane.config();

            expect(TestplaneConfig).toBeCalledWith({ someKey: "someValue" });
            expect(result).toBeInstanceOf(TestplaneConfig);
        });

        it("should throw an error with invalid JSON", async () => {
            packageManagerRunnerMock.getExecOutput.mockResolvedValue("invalid-json");
            await expect(testplane.config()).rejects.toThrow(
                'Couldn\'t parse Testplane config: "testplane config" returned invalid json:',
            );
        });
    });

    describe("installDependencies", () => {
        it("should skip installing dependencies when not using local browsers", async () => {
            const configMock = {
                isUsingLocalBrowsers: jest.fn().mockReturnValue(false),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);

            await testplane.installDependencies();

            expect(configMock.isUsingLocalBrowsers).toBeCalled();
            expect(packageManagerRunnerMock.exec).not.toBeCalled();
        });

        it("should install dependencies when using local browsers", async () => {
            const configMock = {
                isUsingLocalBrowsers: jest.fn().mockReturnValue(true),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);

            await testplane.installDependencies();

            expect(configMock.isUsingLocalBrowsers).toBeCalled();
            expect(packageManagerRunnerMock.exec).toBeCalledWith(
                ["testplane", "install-deps", "--config", "configPath"],
                { silent: false },
            );
        });
    });

    describe("run", () => {
        it("should correctly run testplane and set outputs", async () => {
            const configMock = {
                hasHtmlReporterPlugin: jest.fn().mockReturnValue(true),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            packageManagerRunnerMock.exec.mockResolvedValue(0);
            jest.mocked(existsSync).mockReturnValue(true);

            await testplane.run();

            expect(core.setOutput).toHaveBeenCalledWith(OUTPUT.EXIT_CODE, 0);
            expect(core.setOutput).toHaveBeenCalledWith(
                OUTPUT.HTML_REPORT_PATH,
                "testplane-reports/2025-01-01/12819471512/1",
            );
        });

        it("should pass cwd relative html-reporter report path", async () => {
            const configMock = {
                hasHtmlReporterPlugin: jest.fn().mockReturnValue(true),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            packageManagerRunnerMock.exec.mockResolvedValue(0);
            jest.mocked(getHtmlReporterOverrideReportPathEnv).mockReturnValue({ html_reporter_path: "some/path" });
            jest.mocked(existsSync).mockReturnValue(true);
            jest.mocked(core.getInput).mockImplementation((inputName: string) => {
                if (inputName === INPUT.CWD) {
                    return "project-path";
                }

                return `${inputName}-input`;
            });

            await testplane.run();

            expect(packageManagerRunnerMock.exec).toBeCalledWith(
                expect.arrayContaining(["testplane"]),
                expect.objectContaining({
                    env: expect.objectContaining({ html_reporter_path: "../some/path" }),
                }),
            );
        });

        it("should not set missing html-reporter path output if report is missing", async () => {
            const configMock = {
                hasHtmlReporterPlugin: jest.fn().mockReturnValue(true),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            packageManagerRunnerMock.exec.mockResolvedValue(0);
            jest.mocked(existsSync).mockReturnValue(false);

            await testplane.run();

            expect(core.setOutput).toHaveBeenCalledWith(OUTPUT.EXIT_CODE, 0);
            expect(core.setOutput).not.toHaveBeenCalledWith(OUTPUT.HTML_REPORT_PATH);
        });

        it("should not set missing html-reporter output if reporter is absent", async () => {
            const configMock = {
                hasHtmlReporterPlugin: jest.fn().mockReturnValue(false),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            packageManagerRunnerMock.exec.mockResolvedValue(0);

            await testplane.run();

            expect(core.setOutput).toHaveBeenCalledWith(OUTPUT.EXIT_CODE, 0);
            expect(core.setOutput).not.toHaveBeenCalledWith(OUTPUT.HTML_REPORT_PATH);
        });

        it("should add extra cli options", async () => {
            jest.mocked(core.getInput).mockImplementation((inputName: string) => {
                switch (inputName) {
                    case INPUT.BROWSER:
                        return "chrome,firefox";
                    case INPUT.SET:
                        return "mobile,desktop";
                    case INPUT.GREP:
                        return "foobar";
                    case INPUT.STORYBOOK:
                        return "true";
                    default:
                        return "default-input";
                }
            });
            const configMock = {
                hasHtmlReporterPlugin: jest.fn().mockReturnValue(false),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            packageManagerRunnerMock.exec.mockResolvedValue(0);

            await testplane.run();

            const sets = ["--set", "mobile", "--set", "desktop"];
            const browsers = ["--browser", "chrome", "--browser", "firefox"];
            expect(packageManagerRunnerMock.exec).toBeCalledWith(
                ["testplane", "--config", "configPath", "--storybook", ...sets, ...browsers, "--grep", "foobar"],
                expect.objectContaining({ canThrow: false, silent: false }),
            );
            expect(core.setOutput).toHaveBeenCalledWith(OUTPUT.EXIT_CODE, 0);
        });
    });

    describe("getPostMortemData", () => {
        it("should return post mortem data", async () => {
            const configMock = {
                getLastFailedTestsJsonPath: jest.fn().mockReturnValue("/some/path"),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            jest.mocked(fsPromises.readFile).mockResolvedValue('[{"fullTitle": "test1"}]');
            jest.mocked(groupTestsByFullTitle).mockReturnValue({ test1: ["browser1"] });
            jest.mocked(getRootRelativePath).mockReturnValue("cwd/some/path");

            const result = await testplane.getPostMortemData();

            expect(fsPromises.readFile).toHaveBeenCalledWith("cwd/some/path", { encoding: "utf8" });
            expect(core.setOutput).toHaveBeenCalledWith(OUTPUT.FAILED_TESTS_PATH, expect.any(String));
            expect(result).toEqual({
                failedTestsCount: 1,
                failedTests: { test1: ["browser1"] },
            });
        });

        it("should handle parsing errors gracefully", async () => {
            const configMock = {
                getLastFailedTestsJsonPath: jest.fn().mockReturnValue("/some/invalid/path"),
            } as unknown as TestplaneConfig;
            jest.spyOn(testplane, "config").mockResolvedValue(configMock);
            jest.mocked(fsPromises.readFile).mockRejectedValue(new Error("File not found"));

            const result = await testplane.getPostMortemData();

            expect(core.warning).toHaveBeenCalledWith(
                expect.stringContaining("Unable to parse Testplane failed tests:"),
            );
            expect(core.setOutput).not.toBeCalledWith(OUTPUT.FAILED_TESTS_PATH);
            expect(result).toEqual({
                failedTestsCount: null,
                failedTests: null,
            });
        });
    });

    describe("withConfig", () => {
        it("should return command with config when configPath is present", () => {
            const result = testplane["withConfig"](["testplane", "command"]);
            expect(result).toEqual(["testplane", "command", "--config", "configPath"]);
        });

        it("should return command without config when configPath is absent", () => {
            const testplaneWithoutConfig = new Testplane(packageManagerRunnerMock, "");
            const result = testplaneWithoutConfig["withConfig"](["testplane", "command"]);
            expect(result).toEqual(["testplane", "command"]);
        });
    });
});
