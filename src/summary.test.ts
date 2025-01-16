import assert from "node:assert/strict";
import { jest, expect } from "@jest/globals";
import core from "@actions/core";
import { writeSuccessSummary, writeFailureSummary } from "./summary.js";

jest.mock("@actions/core");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectCallOrder = (...mocks: jest.MockedFunction<(...args: any[]) => unknown>[]) => {
    for (let i = 0; i < mocks.length - 1; i++) {
        const firstMockCallTimes = mocks[i].mock.invocationCallOrder;
        const secondMockCallTimes = mocks[i + 1].mock.invocationCallOrder;

        assert(firstMockCallTimes && firstMockCallTimes.length, `Mock function ${i + 1} was never called`);
        assert(secondMockCallTimes && secondMockCallTimes.length, `Mock function ${i + 2} was never called`);

        const firstMockFirstCallTime = firstMockCallTimes[0];
        const secondMockLastCallTime = secondMockCallTimes[secondMockCallTimes.length - 1];

        assert(
            firstMockFirstCallTime < secondMockLastCallTime,
            `Mock function ${i + 2}'th was called before ${i + 1}'th`,
        );
    }
};

describe("summary", () => {
    describe("writeSuccessSummary", () => {
        it("should write success summary", async () => {
            await writeSuccessSummary();

            expect(core.summary.emptyBuffer).toBeCalled();
            expect(core.summary.addHeading).toBeCalledWith(":white_check_mark: Testplane status");
            expect(core.summary.addEOL).toBeCalledWith();
            expect(core.summary.addRaw).toBeCalledWith("Testplane tests completed successfully", true);
            expect(core.summary.write).toBeCalledWith({ overwrite: true });

            expectCallOrder(
                jest.mocked(core.summary.emptyBuffer),
                jest.mocked(core.summary.addHeading),
                jest.mocked(core.summary.addEOL),
                jest.mocked(core.summary.addRaw),
                jest.mocked(core.summary.write),
            );
        });
    });

    describe("writeFailureSummary", () => {
        it("should write failure summary with failed tests stats", async () => {
            await writeFailureSummary({
                failedTestsCount: 3,
                failedTests: {
                    "test-1": ["chrome", "safari"],
                    "test-2": ["chrome"],
                },
            });

            const failedTestsDetails = [
                "<ul>",
                '<li>"<code>test-1</code>" failed in browsers: "<code>chrome</code>", "<code>safari</code>"</li>',
                '<li>"<code>test-2</code>" failed in browsers: "<code>chrome</code>"</li>',
                "</ul>",
            ].join("");

            expect(core.summary.emptyBuffer).toBeCalled();
            expect(core.summary.addHeading).toBeCalledWith(":x: Testplane status");
            expect(core.summary.addEOL).toBeCalledWith();
            expect(core.summary.addRaw).toBeCalledWith("Testplane tests are failed", true);
            expect(core.summary.addDetails).toBeCalledWith("3 failed tests", failedTestsDetails);
            expect(core.summary.write).toBeCalledWith({ overwrite: true });

            expectCallOrder(
                jest.mocked(core.summary.emptyBuffer),
                jest.mocked(core.summary.addHeading),
                jest.mocked(core.summary.addEOL),
                jest.mocked(core.summary.addRaw),
                jest.mocked(core.summary.write),
            );
        });

        it("should write failure summary without failed tests stats", async () => {
            await writeFailureSummary({ failedTestsCount: null, failedTests: null });

            expect(core.summary.emptyBuffer).toBeCalled();
            expect(core.summary.addHeading).toBeCalledWith(":x: Testplane status");
            expect(core.summary.addEOL).toBeCalledWith();
            expect(core.summary.addRaw).toBeCalledWith("Testplane tests are failed", true);
            expect(core.summary.write).toBeCalledWith({ overwrite: true });

            expectCallOrder(
                jest.mocked(core.summary.emptyBuffer),
                jest.mocked(core.summary.addHeading),
                jest.mocked(core.summary.addEOL),
                jest.mocked(core.summary.addRaw),
                jest.mocked(core.summary.write),
            );
        });
    });
});
