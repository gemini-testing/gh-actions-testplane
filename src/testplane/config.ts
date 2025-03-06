import { LOCAL_GRID_URL, PLUGINS } from "../constants.js";
import type { Config } from "testplane";

interface PluginConfig {
    enabled?: boolean;
}

export class TestplaneConfig {
    constructor(private config: Config) {}

    public hasHtmlReporterPlugin() {
        return this.hasEnabledPlugin(PLUGINS.HTML_REPORTER);
    }

    public isUsingLocalBrowsers() {
        return this.config.gridUrl === LOCAL_GRID_URL;
    }

    public getLastFailedTestsJsonPath() {
        return this.config.lastFailed.output;
    }

    private hasEnabledPlugin(pluginName: (typeof PLUGINS)[keyof typeof PLUGINS], isEnabledByDefault = true) {
        const pluginConfig = this.config.plugins[pluginName] as PluginConfig | undefined;

        if (!pluginConfig) {
            return false;
        }

        return Boolean(pluginConfig.enabled ?? isEnabledByDefault);
    }
}
