import core from "@actions/core";
import * as html from "./html.js";
import type { PostMortemData } from "./testplane/index.js";

export const writeSuccessSummary = async () => {
    await core.summary
        .emptyBuffer()
        .addHeading(":white_check_mark: Testplane status")
        .addEOL()
        .addRaw("Testplane tests completed successfully", true)
        .write({ overwrite: true });
};

export const writeFailureSummary = async (postMortemData: PostMortemData) => {
    core.summary.emptyBuffer().addHeading(":x: Testplane status").addEOL().addRaw("Testplane tests are failed", true);

    if (!postMortemData.failedTests || !postMortemData.failedTestsCount) {
        await core.summary.write({ overwrite: true });

        return;
    }

    const failedTestsListElements = Object.entries(postMortemData.failedTests).map(([fullTitle, browserIds]) => {
        const fullTitleHtml = `"${html.code(fullTitle)}"`;
        const browserIdsHtml = browserIds.map((browserId) => `"${html.code(browserId)}"`).join(", ");

        return html.listElement(`${fullTitleHtml} failed in browsers: ${browserIdsHtml}`);
    });

    const listHtml = html.unorderedList(failedTestsListElements.join(""));

    await core.summary
        .addDetails(`${postMortemData.failedTestsCount} failed tests`, listHtml)
        .write({ overwrite: true });
};
