import github from "@actions/github";
import core from "@actions/core";
import path from "node:path";

import { INPUT } from "./constants.js";
import { getDateUTCNowString } from "./utils.js";

export const getHtmlReporterOverrideReportPathEnv = (): { html_reporter_path: string } => {
    const reportPrefix = core.getInput(INPUT.HTML_REPORT_PREFIX);
    const reportDate = getDateUTCNowString();
    const runId = github.context.runId;
    const runNumber = github.context.runNumber;

    const reportPath = [reportPrefix, reportDate, runId, runNumber].join(path.sep);

    return { html_reporter_path: reportPath };
};
