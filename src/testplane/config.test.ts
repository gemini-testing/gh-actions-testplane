import { expect } from "@jest/globals";
import { TestplaneConfig } from "./config.js";
import { LOCAL_GRID_URL, PLUGINS } from "../constants";
import type { Config } from "testplane";

describe("TestplaneConfig", () => {
    let mockConfig: Config;

    beforeEach(() => {
        mockConfig = {
            gridUrl: LOCAL_GRID_URL,
            lastFailed: { only: false, input: ".testplane/last-failed.json", output: ".testplane/last-failed.json" },
            plugins: {
                [PLUGINS.HTML_REPORTER]: { enabled: true },
            },
        } as unknown as Config;
    });

    describe("hasHtmlReporterPlugin", () => {
        it("should return true if the HTML reporter plugin is enabled", () => {
            mockConfig.plugins[PLUGINS.HTML_REPORTER] = { enabled: true };

            const testplaneConfig = new TestplaneConfig(mockConfig);
            expect(testplaneConfig.hasHtmlReporterPlugin()).toBe(true);
        });

        it("should return false if the HTML reporter plugin is not enabled", () => {
            mockConfig.plugins[PLUGINS.HTML_REPORTER] = { enabled: false };

            const testplaneConfig = new TestplaneConfig(mockConfig);
            expect(testplaneConfig.hasHtmlReporterPlugin()).toBe(false);
        });

        it("should return false if the HTML reporter plugin is not present", () => {
            delete mockConfig.plugins[PLUGINS.HTML_REPORTER];

            const testplaneConfig = new TestplaneConfig(mockConfig);
            expect(testplaneConfig.hasHtmlReporterPlugin()).toBe(false);
        });
    });

    describe("isUsingLocalBrowsers", () => {
        it("should return true if using the local grid URL", () => {
            mockConfig.gridUrl = LOCAL_GRID_URL;

            const testplaneConfig = new TestplaneConfig(mockConfig);
            expect(testplaneConfig.isUsingLocalBrowsers()).toBe(true);
        });

        it("should return false if not using the local grid URL", () => {
            mockConfig.gridUrl = "https://another-grid-url.com";

            const testplaneConfig = new TestplaneConfig(mockConfig);
            expect(testplaneConfig.isUsingLocalBrowsers()).toBe(false);
        });
    });

    describe("getLastFailedTestsJsonPath", () => {
        it("should return the path to the last failed tests JSON file", () => {
            mockConfig.lastFailed.output = ".testplane/last-failed.json";

            const testplaneConfig = new TestplaneConfig(mockConfig);
            expect(testplaneConfig.getLastFailedTestsJsonPath()).toBe(".testplane/last-failed.json");
        });
    });
});
