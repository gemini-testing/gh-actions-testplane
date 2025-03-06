import core from "@actions/core";
import { existsSync, promises as fsPromises } from "node:fs";
import { getHtmlReporterOverrideReportPathEnv } from "../env.js";
import { INPUT, OUTPUT } from "../constants.js";
import { TestplaneConfig } from "./config.js";
import { groupTestsByFullTitle, getRootRelativePath, type Test, getCwdRelativePath } from "../utils.js";
import type { PackageManagerRunner } from "../package-manager-runner.js";

type Version = number;
type MajorVersion = Version;
type MinorVersion = Version;
type PatchVersion = Version;

type FullName = string;
type BrowserId = string;

export interface PostMortemData {
    failedTestsCount: number | null;
    failedTests: Record<FullName, BrowserId[]> | null;
}

export class Testplane {
    constructor(
        private pm: PackageManagerRunner,
        private configPath: string,
    ) {}

    public async version(): Promise<[MajorVersion, MinorVersion, PatchVersion]> {
        const commandOutput = await this.pm.getExecOutput(this.withConfig(["testplane", "--version"]));
        const semverNumbers = commandOutput.split(".").map(Number) as [MajorVersion, MinorVersion, PatchVersion];

        this.version = () => Promise.resolve(semverNumbers);

        return semverNumbers;
    }

    public async listBrowsers(): Promise<string> {
        const commandOutput = await this.pm.getExecOutput(this.withConfig(["testplane", "list-browsers"]));

        this.listBrowsers = () => Promise.resolve(commandOutput);

        return commandOutput;
    }

    public async config(): Promise<TestplaneConfig> {
        const commandOutput = await this.pm.getExecOutput(this.withConfig(["testplane", "config"]));

        try {
            const configParsed = JSON.parse(commandOutput);
            const testplaneConfig = new TestplaneConfig(configParsed);

            this.config = () => Promise.resolve(testplaneConfig);

            return testplaneConfig;
        } catch (err) {
            throw new Error(
                [`Couldn't parse Testplane config: "testplane config" returned invalid json:`, commandOutput].join(
                    "\n",
                ),
            );
        }
    }

    public async installDependencies() {
        const testplaneConfig = await this.config();

        if (!testplaneConfig.isUsingLocalBrowsers()) {
            core.debug("Skip installing dependencies as gridUrl is not matching");

            return;
        }

        core.debug("Running Testplane install-deps");

        await this.pm.exec(this.withConfig(["testplane", "install-deps"]), { silent: false });
    }

    public async run(): Promise<number> {
        const testplaneConfig = await this.config();
        const hasHtmlReporter = testplaneConfig.hasHtmlReporterPlugin();
        const htmlReporterReporterPathEnv = getHtmlReporterOverrideReportPathEnv();
        const htmlReporterRootRelativePath = htmlReporterReporterPathEnv.html_reporter_path;

        htmlReporterReporterPathEnv.html_reporter_path = getCwdRelativePath(htmlReporterRootRelativePath);

        const env = {
            ...htmlReporterReporterPathEnv,
            ...process.env,
        };

        core.debug(`Running Testplane with ${this.configPath || "default"} config`);

        const exitCode = await this.pm.exec(this.getTestplaneCliCommand(), { silent: false, canThrow: false, env });

        core.debug(`Testplane finished with exit code ${exitCode}`);

        core.setOutput(OUTPUT.EXIT_CODE, exitCode);

        if (!hasHtmlReporter) {
            core.debug(`Skip setting output ${OUTPUT.HTML_REPORT_PATH} as there is not enabled html-reporter`);

            return exitCode;
        }

        if (existsSync(htmlReporterRootRelativePath)) {
            core.setOutput(OUTPUT.HTML_REPORT_PATH, htmlReporterRootRelativePath);
        } else {
            core.debug(
                [
                    `Not setting ${OUTPUT.HTML_REPORT_PATH} because "${env.html_reporter_path}" is absent.`,
                    "Probably Testplane run crashed.",
                ].join("\n"),
            );
        }

        return exitCode;
    }

    public async getPostMortemData(): Promise<PostMortemData> {
        const tesptlaneConfig = await this.config();
        const testplaneFailedTestsJsonPath = tesptlaneConfig.getLastFailedTestsJsonPath();

        try {
            const testplaneFailedTestsJsonString = await fsPromises.readFile(testplaneFailedTestsJsonPath, {
                encoding: "utf8",
            });
            const testplaneFailedTests: Test[] = JSON.parse(testplaneFailedTestsJsonString);
            const fullTitleGroupedTests = groupTestsByFullTitle(testplaneFailedTests);

            const testplaneFailedTestsJsonRootRelativePath = getRootRelativePath(testplaneFailedTestsJsonPath);

            core.setOutput(OUTPUT.FAILED_TESTS_PATH, testplaneFailedTestsJsonRootRelativePath);

            return { failedTestsCount: testplaneFailedTests.length, failedTests: fullTitleGroupedTests };
        } catch (err) {
            core.warning(`Unable to parse Testplane failed tests: ${err}`);

            return { failedTestsCount: null, failedTests: null };
        }
    }

    private withConfig(commandWithArgs: string[]): string[] {
        if (!this.configPath) {
            return commandWithArgs;
        }

        return commandWithArgs.concat(["--config", this.configPath]);
    }

    private getTestplaneCliCommand(): string[] {
        const options = this.withConfig(["testplane"]);

        const storybook = core.getInput(INPUT.STORYBOOK);
        const set = core.getInput(INPUT.SET);
        const browser = core.getInput(INPUT.BROWSER);
        const grep = core.getInput(INPUT.GREP);

        if (storybook && storybook !== String(false)) {
            options.push("--storybook");
        }

        if (set) {
            set.split(",").forEach((s) => options.push("--set", s));
        }

        if (browser) {
            browser.split(",").forEach((b) => options.push("--browser", b));
        }

        if (grep) {
            options.push("--grep", grep);
        }

        return options;
    }
}
