import path from "node:path";
import { jest, expect } from "@jest/globals";
import core from "@actions/core";
import { getDateUTCNowString } from "./utils";
import { getHtmlReporterOverrideReportPathEnv } from "./env";

jest.mock("@actions/github", () => ({ context: { runId: 100500, runNumber: 500100 } }));
jest.mock("./utils");

describe("env", () => {
    describe("getHtmlReporterOverrideReportPathEnv", () => {
        it("should return report path with prefix, current date, runId and runNumber", () => {
            jest.mocked(getDateUTCNowString).mockReturnValue("2010-01-30");

            const env = getHtmlReporterOverrideReportPathEnv();

            expect(env.html_reporter_path).toBe(
                "html-report-prefix-input/2010-01-30/100500/500100".replaceAll("/", path.sep),
            );
        });

        it("should return report path with custon prefix", () => {
            jest.mocked(core.getInput).mockReturnValue("custom-report-prefix");
            jest.mocked(getDateUTCNowString).mockReturnValue("2010-01-30");

            const env = getHtmlReporterOverrideReportPathEnv();

            expect(env.html_reporter_path).toBe(
                "custom-report-prefix/2010-01-30/100500/500100".replaceAll("/", path.sep),
            );
        });
    });
});
