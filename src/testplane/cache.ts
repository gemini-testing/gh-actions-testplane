import core from "@actions/core";
import cache from "@actions/cache";
import assert from "node:assert/strict";

import { calcSha256 } from "../utils.js";
import { TESTPLANE_BROWSERS_DEFAULT_PATH } from "../constants.js";
import type { Testplane } from "./testplane.js";

export class TestplaneCache {
    private cachePrimaryKey: string | null = null;
    private cacheRestoreKey: string | null = null;
    private restoredCacheKey: string | null = null;
    private needsBrowsersCache: boolean | null = null;
    private testplaneCachePath = process.env.TESTPLANE_BROWSERS_PATH || TESTPLANE_BROWSERS_DEFAULT_PATH;

    constructor(private testplane: Testplane) {}

    public async restoreCache(): Promise<boolean> {
        await this.init();

        if (!this.needsBrowsersCache) {
            return false;
        }

        core.debug("Restore Testplane browsers cache");

        const cachePaths = [this.testplaneCachePath];
        const primaryKey = this.getCachePrimaryKey();
        const restoreKeys = [this.getCacheRestoreKey()];

        this.restoredCacheKey = (await cache.restoreCache(cachePaths, primaryKey, restoreKeys)) ?? null;

        return this.restoredCacheKey === primaryKey;
    }

    public async saveCache(): Promise<void> {
        await this.init();

        if (!this.needsBrowsersCache || this.restoredCacheKey === this.cachePrimaryKey) {
            return;
        }

        core.debug("Save Testplane browsers cache");

        await cache.saveCache([this.testplaneCachePath], this.getCachePrimaryKey());
    }

    private async init(): Promise<void> {
        const testplaneConfig = await this.testplane.config();

        this.needsBrowsersCache = testplaneConfig.isUsingLocalBrowsers();

        if (!this.needsBrowsersCache) {
            core.debug(`Skip Testplane browsers caching as gridUrl is not matching`);

            return;
        }

        if (this.needsBrowsersCache && !cache.isFeatureAvailable()) {
            this.needsBrowsersCache = false;

            core.debug(`Skip Testplane browsers caching as cache service is not available`);

            return;
        }

        const testplaneBrowsers = await this.testplane.listBrowsers();

        core.debug(`Described Testplane browsers: "${testplaneBrowsers}"`);

        this.cacheRestoreKey = `${core.platform.platform}-${core.platform.arch}-testplane_browsers-`;
        this.cachePrimaryKey = this.cacheRestoreKey + calcSha256(testplaneBrowsers);

        core.debug(`Testplane browsers cache primary key: "${this.cachePrimaryKey}"`);

        this.init = () => Promise.resolve();
    }

    private getCachePrimaryKey(): string {
        assert(this.cachePrimaryKey, "cachePrimaryKey is not initialized");

        return this.cachePrimaryKey;
    }

    private getCacheRestoreKey(): string {
        assert(this.cacheRestoreKey, "cacheRestoreKey is not initialized");

        return this.cacheRestoreKey;
    }
}
