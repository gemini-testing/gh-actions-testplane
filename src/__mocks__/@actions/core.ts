import type core from "@actions/core";
import { jest } from "@jest/globals";

export const startGroup = jest.fn();
export const endGroup = jest.fn();
export const group = jest.fn().mockImplementation((_: unknown, fn: unknown) => (fn as () => Promise<void>)());

export const isDebug = jest.fn().mockReturnValue(true);
export const debug = jest.fn();
export const warning = jest.fn();

export const getInput = jest.fn<(typeof core)["getInput"]>((inputName: string) => `${inputName}-input`);
export const setOutput = jest.fn();
export const setFailed = jest.fn();

export const platform = {
    platform: "linux",
    arch: "arm64",
};

export const summary = {} as typeof core.summary;

summary.emptyBuffer = jest.fn<(typeof core)["summary"]["emptyBuffer"]>().mockReturnValue(summary);
summary.addHeading = jest.fn<(typeof core)["summary"]["addHeading"]>().mockReturnValue(summary);
summary.addDetails = jest.fn<(typeof core)["summary"]["addDetails"]>().mockReturnValue(summary);
summary.addEOL = jest.fn<(typeof core)["summary"]["addEOL"]>().mockReturnValue(summary);
summary.addRaw = jest.fn<(typeof core)["summary"]["addRaw"]>().mockReturnValue(summary);
summary.write = jest.fn<(typeof core)["summary"]["write"]>().mockResolvedValue(summary);

export default {
    startGroup,
    endGroup,
    group,
    isDebug,
    debug,
    warning,
    getInput,
    setFailed,
    setOutput,
    platform,
    summary,
};
