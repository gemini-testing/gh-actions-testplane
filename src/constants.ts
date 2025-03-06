export const LOCAL_GRID_URL = "local";
export const TESTPLANE_BROWSERS_DEFAULT_PATH = "~/.testplane";

export const INPUT = {
    CWD: "cwd",
    PACKAGE_MANAGER: "package-manager",
    HTML_REPORT_PREFIX: "html-report-prefix",
    CONFIG_PATH: "config-path",
    STORYBOOK: "storybook",
    SET: "set",
    BROWSER: "browser",
    GREP: "grep",
} as const;

export const OUTPUT = {
    HTML_REPORT_PATH: "html-report-path",
    FAILED_TESTS_PATH: "failed-tests-path",
    EXIT_CODE: "exit-code",
} as const;

export const PLUGINS = {
    HTML_REPORTER: "html-reporter/testplane",
} as const;
