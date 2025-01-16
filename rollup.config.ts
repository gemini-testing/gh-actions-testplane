// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const config = {
    input: "src/index.ts",
    output: {
        esModule: true,
        format: "es",
        sourcemap: false,
        plugins: [terser()],
    },
    plugins: [typescript(), nodeResolve(), json(), commonjs()],
};

export default config;
