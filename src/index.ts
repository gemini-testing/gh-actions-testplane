import core from "@actions/core";

import { INPUT } from "./constants.js";
import { PackageManagerRunner, type PackageManager } from "./package-manager-runner.js";
import { Testplane, TestplaneCache } from "./testplane/index.js";
import { writeFailureSummary, writeSuccessSummary } from "./summary.js";

async function main() {
    const packageManager = new PackageManagerRunner(core.getInput(INPUT.PACKAGE_MANAGER) as PackageManager);
    const testplane = new Testplane(packageManager, core.getInput(INPUT.CONFIG_PATH));
    const testplaneCache = new TestplaneCache(testplane);

    const primaryCacheHit = await core.group("restore cache", () => testplaneCache.restoreCache());

    await core.group("install dependencies", () => testplane.installDependencies({ primaryCacheHit }));

    const exitCode = await core.group("run testplane", () => testplane.run());

    if (exitCode) {
        const postMortemData = await core.group("gather summary", () => testplane.getPostMortemData());

        await core.group("write summary", () => writeFailureSummary(postMortemData));

        core.setFailed(`Testplane run failed with exit code ${exitCode}`);
    } else {
        await core.group("save cache", () => testplaneCache.saveCache());

        await core.group("write summary", () => writeSuccessSummary());
    }
}

main().catch((error) => core.setFailed(error));
