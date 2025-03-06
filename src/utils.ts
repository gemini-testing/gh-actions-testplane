import core from "@actions/core";
import { createHash } from "node:crypto";
import path from "node:path";
import { INPUT } from "./constants.js";

export interface Test {
    fullTitle: string;
    browserId: string;
}

export const getDateUTCNowString = () => {
    const dateNow = new Date();

    const year = dateNow.getUTCFullYear();
    const month = String(dateNow.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateNow.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const groupTestsByFullTitle = (tests: Test[]): Record<string, string[]> => {
    const groupedTests: Record<string, string[]> = {};

    for (const { fullTitle, browserId } of tests) {
        groupedTests[fullTitle] ||= [];

        groupedTests[fullTitle].push(browserId);
    }

    return groupedTests;
};

export const calcSha256 = (input: string): string => {
    const sha256 = createHash("sha256");

    sha256.update(input);

    return sha256.digest("hex");
};

export const getRootRelativePath = (cwdRelativePath: string) => {
    const cwdPath = core.getInput(INPUT.CWD);

    return path.join(cwdPath, cwdRelativePath);
};

export const getCwdRelativePath = (rootRelativePath: string) => {
    const cwdPath = core.getInput(INPUT.CWD);

    return path.join(path.relative(cwdPath, "."), rootRelativePath);
};
