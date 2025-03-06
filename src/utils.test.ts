import path from "node:path";
import { jest, expect } from "@jest/globals";
import core from "@actions/core";
import { getDateUTCNowString, groupTestsByFullTitle, calcSha256, getRootRelativePath, type Test } from "./utils.js";
import { INPUT } from "./constants.js";

jest.mock("@actions/core");

describe("utils", () => {
    describe("getDateUTCNowString", () => {
        it("should return the current date in UTC format YYYY-MM-DD", () => {
            const mockDate = new Date(Date.UTC(2010, 0, 10));
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);

            const dateString = getDateUTCNowString();

            expect(dateString).toBe("2010-01-10");
        });
    });

    describe("groupTestsByFullTitle", () => {
        it("should group tests by fullTitle", () => {
            const tests: Test[] = [
                { fullTitle: "Test 1", browserId: "chrome" },
                { fullTitle: "Test 1", browserId: "firefox" },
                { fullTitle: "Test 2", browserId: "safari" },
            ];

            const grouped = groupTestsByFullTitle(tests);

            expect(grouped).toEqual({
                "Test 1": ["chrome", "firefox"],
                "Test 2": ["safari"],
            });
        });

        it("should return an empty object for an empty array", () => {
            const grouped = groupTestsByFullTitle([]);

            expect(grouped).toEqual({});
        });
    });

    describe("calcSha256", () => {
        describe("calcSha256", () => {
            it("should calculate sha256 hex hash", () => {
                const emptyInput = "";
                const emptyInputHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

                expect(calcSha256(emptyInput)).toBe(emptyInputHash);
            });
        });
    });

    describe("getRootRelativePath", () => {
        it("should return the same path with default cwd", () => {
            jest.mocked(core.getInput).mockReturnValueOnce(".");

            const rootRelativePath = getRootRelativePath(`some${path.sep}path`);

            expect(rootRelativePath).toBe(`some${path.sep}path`);
        });

        it("should return the same path with default cwd", () => {
            jest.mocked(core.getInput).mockImplementation((inputName: string) => {
                return inputName === INPUT.CWD ? "some-cwd" : "default-input-value";
            });

            const rootRelativePath = getRootRelativePath(`some${path.sep}path`);

            expect(rootRelativePath).toBe(`some-cwd${path.sep}some${path.sep}path`);
        });
    });
});
