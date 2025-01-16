import * as html from "./html";
import { expect } from "@jest/globals";

describe("html", () => {
    it("code", () => {
        expect(html.code("some html")).toBe("<code>some html</code>");
    });

    it("listElement", () => {
        expect(html.listElement("some html")).toBe("<li>some html</li>");
    });

    it("unorderedList", () => {
        expect(html.unorderedList("some html")).toBe("<ul>some html</ul>");
    });
});
