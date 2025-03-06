import { jest, expect } from "@jest/globals";
import { TestplaneCache } from "./cache.js";
import core from "@actions/core";
import cache from "@actions/cache";
import type { TestplaneConfig } from "./config.js";
import type { Testplane } from "./testplane.js";

jest.mock("@actions/core");
jest.mock("@actions/cache", () => ({
    isFeatureAvailable: jest.fn(() => true),
    restoreCache: jest.fn(),
    saveCache: jest.fn(),
}));

describe("TestplaneCache", () => {
    const mockCoreDebug = jest.mocked(core.debug);
    const mockCacheRestore = jest.mocked(cache.restoreCache);
    const mockCacheSave = jest.mocked(cache.saveCache);

    let mockTestplane: jest.Mocked<Testplane>;
    let mockConfig: jest.Mocked<TestplaneConfig>;
    let testplaneCache: TestplaneCache;

    beforeEach(() => {
        mockConfig = {
            isUsingLocalBrowsers: jest.fn(() => true),
            hasHtmlReporterPlugin: jest.fn(() => false),
            getLastFailedTestsJsonPath: jest.fn(() => ".testplane/last-failed.json"),
        } as unknown as jest.Mocked<TestplaneConfig>;
        mockTestplane = {
            config: jest.fn<Testplane["config"]>().mockResolvedValue(mockConfig),
            listBrowsers: jest.fn<Testplane["listBrowsers"]>().mockResolvedValue("chrome@130 firefox@130"),
        } as unknown as jest.Mocked<Testplane>;
        testplaneCache = new TestplaneCache(mockTestplane);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("restoreCache", () => {
        it("should restore cache when using local browsers", async () => {
            mockConfig.isUsingLocalBrowsers.mockReturnValue(true);
            mockCacheRestore.mockResolvedValue("restoredKey");

            await testplaneCache.restoreCache();

            expect(mockCoreDebug).toHaveBeenCalledWith("Restore Testplane browsers cache");
            expect(mockCacheRestore).toHaveBeenCalled();
        });

        it("should not restore cache when needsBrowsersCache is false", async () => {
            mockConfig.isUsingLocalBrowsers.mockReturnValue(false);

            await testplaneCache.restoreCache();

            expect(mockCoreDebug).not.toHaveBeenCalledWith("Restore Testplane browsers cache");
            expect(mockCacheRestore).not.toHaveBeenCalled();
        });

        it("should not restore cache when cache service is not available", async () => {
            mockConfig.isUsingLocalBrowsers.mockReturnValue(true);
            jest.mocked(cache.isFeatureAvailable).mockReturnValueOnce(false);

            await testplaneCache.restoreCache();

            expect(mockCoreDebug).not.toHaveBeenCalledWith("Restore Testplane browsers cache");
            expect(mockCacheRestore).not.toHaveBeenCalled();
        });
    });

    describe("saveCache", () => {
        it("should save cache whith local browsers and unmatched restoredCacheKey", async () => {
            mockConfig.isUsingLocalBrowsers.mockReturnValue(true);
            mockCacheRestore.mockResolvedValue("differentKey");

            await testplaneCache.restoreCache();
            await testplaneCache.saveCache();

            expect(mockCoreDebug).toHaveBeenCalledWith("Save Testplane browsers cache");
            expect(mockCacheSave).toHaveBeenCalled();
        });

        it("should not save cache when needsBrowsersCache is false", async () => {
            mockConfig.isUsingLocalBrowsers.mockReturnValue(false);

            await testplaneCache.saveCache();

            expect(mockCoreDebug).not.toHaveBeenCalledWith("Save Testplane browsers cache");
            expect(mockCacheSave).not.toHaveBeenCalled();
        });
    });
});
