import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { articleAddress, articleIdFromAddress, articlePath } from "@/lib/article-path";

describe("article addresses", () => {
  test("put the id after the slug", () => {
    assert.equal(articleAddress({ slug: "u16-izcina-uzvaru", id: 7 }), "u16-izcina-uzvaru-7");
    assert.equal(articlePath({ slug: "u16-izcina-uzvaru", id: 7 }), "/jaunumi/u16-izcina-uzvaru-7");
  });

  test("read a number at the end as a possible id", () => {
    assert.equal(articleIdFromAddress("u16-izcina-uzvaru-7"), 7);
    assert.equal(articleIdFromAddress("sezona-2026"), 2026);
    assert.equal(articleIdFromAddress("u16-izcina-uzvaru"), null);
  });
});
