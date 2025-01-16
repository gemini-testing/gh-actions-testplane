
describe("test", () => {
    it("example", async ({browser}) => {
        await browser.url("https://example.com/");

        await expect(browser.$("p")).toHaveTextContaining("This domain is for use in illustrative examples in documents");
    });
});
