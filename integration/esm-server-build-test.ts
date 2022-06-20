import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import jsonfile from "jsonfile";

import {
  createFixture,
  createAppFixture,
  js,
  json,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("ESM server builds", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      setup: "node",
      files: {
        "app/routes/esm-only-pkg.jsx": js`
          import esmOnlyPkg from "esm-only-pkg";

          export default function EsmOnlyPkg() {
            return <div id="esm-only-pkg">{esmOnlyPkg}</div>;
          }
        `,
        "app/routes/cjs-only-pkg.jsx": js`
          import cjsOnlyPkg from "cjs-only-pkg";

          export default function CjsOnlyPkg() {
            return <div id="cjs-only-pkg">{cjsOnlyPkg}</div>;
          }
        `,
        "remix.config.js": js`
          export default {
            serverBuildTarget: "node",
          };
        `,
        "node_modules/esm-only-pkg/package.json": json({
          name: "esm-only-pkg",
          version: "1.0.0",
          type: "module",
          exports: "./esm-only-pkg.js",
        }),
        "node_modules/esm-only-pkg/esm-only-pkg.js": js`
          export default "esm-only-pkg";
        `,
        "node_modules/cjs-only-pkg/package.json": json({
          name: "cjs-only-pkg",
          version: "1.0.0",
          type: "commonjs",
          exports: "./cjs-only-pkg.js",
        }),
        "node_modules/cjs-only-pkg/cjs-only-pkg.js": js`
          module.exports = "cjs-only-pkg";
        `,
        "package.json": json({
          ...(await jsonfile.readFile(
            path.join(__dirname, "helpers/node-template/package.json")
          )),
          type: "module",
        }),
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => appFixture.close());

  test("allows consumption of ESM modules", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/esm-only-pkg", true);
    expect(res!.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#esm-only-pkg")).toBe(
      '<div id="esm-only-pkg">esm-only-pkg</div>'
    );
  });

  test("allows consumption of CJS modules", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let res = await app.goto("/cjs-only-pkg", true);
    expect(res!.status()).toBe(200); // server rendered fine
    // rendered the page instead of the error boundary
    expect(await app.getHtml("#cjs-only-pkg")).toBe(
      '<div id="cjs-only-pkg">cjs-only-pkg</div>'
    );
  });
});
