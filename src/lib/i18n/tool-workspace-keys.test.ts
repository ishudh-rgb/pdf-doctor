import { describe, expect, it } from "vitest";

import en from "@/i18n/en.json";

import hi from "@/i18n/hi.json";



const TOOL_WORKSPACE_KEYS = Object.keys(en.toolWorkspace) as (keyof typeof en.toolWorkspace)[];



describe("tool workspace UI i18n", () => {

  it("has matching key sets in en and hi", () => {

    expect(Object.keys(hi.toolWorkspace).sort()).toEqual(Object.keys(en.toolWorkspace).sort());

  });



  for (const key of TOOL_WORKSPACE_KEYS) {

    it(`has Hindi translation for toolWorkspace.${key}`, () => {

      const enVal = en.toolWorkspace[key];

      const hiVal = hi.toolWorkspace[key];

      expect(typeof enVal).toBe("string");

      expect(typeof hiVal).toBe("string");

      expect((hiVal as string).length).toBeGreaterThan(0);

      expect(hiVal).not.toBe(enVal);

    });

  }

});


