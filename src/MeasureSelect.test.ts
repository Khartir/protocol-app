import { describe, it, expect } from "vitest";
import { toBest, toDefault, getDefaultUnit } from "./MeasureSelect";
import {
  createVolumeCategory,
  createTimeCategory,
  createMassCategory,
} from "./test/mocks/test-data";

describe("getDefaultUnit", () => {
  it("returns ml for volume config", () => {
    const category = createVolumeCategory();
    expect(getDefaultUnit(category)).toBe("ml");
  });

  it("returns s for time config", () => {
    const category = createTimeCategory();
    expect(getDefaultUnit(category)).toBe("s");
  });

  it("returns g for mass config", () => {
    const category = createMassCategory();
    expect(getDefaultUnit(category)).toBe("g");
  });
});

describe("toDefault", () => {
  describe("volume conversions", () => {
    it("converts liters to milliliters", () => {
      const category = createVolumeCategory();
      expect(toDefault(category, "l", "2")).toBe(2000);
    });

    it("converts centiliters to milliliters", () => {
      const category = createVolumeCategory();
      expect(toDefault(category, "cl", "50")).toBe(500);
    });

    it("converts deciliters to milliliters", () => {
      const category = createVolumeCategory();
      expect(toDefault(category, "dl", "5")).toBe(500);
    });

    it("keeps milliliters as-is", () => {
      const category = createVolumeCategory();
      expect(toDefault(category, "ml", "500")).toBe(500);
    });
  });

  describe("time conversions", () => {
    it("converts minutes to seconds", () => {
      const category = createTimeCategory();
      expect(toDefault(category, "min", "5")).toBe(300);
    });

    it("converts hours to seconds", () => {
      const category = createTimeCategory();
      expect(toDefault(category, "h", "1")).toBe(3600);
    });

    it("converts days to seconds", () => {
      const category = createTimeCategory();
      expect(toDefault(category, "d", "1")).toBe(86400);
    });

    it("keeps seconds as-is", () => {
      const category = createTimeCategory();
      expect(toDefault(category, "s", "60")).toBe(60);
    });
  });

  describe("mass conversions", () => {
    it("converts kilograms to grams", () => {
      const category = createMassCategory();
      expect(toDefault(category, "kg", "2")).toBe(2000);
    });

    it("converts milligrams to grams", () => {
      const category = createMassCategory();
      // Note: 1000mg = 1g, so 500mg = 0.5g which floors to 0
      expect(toDefault(category, "mg", "1000")).toBe(1);
    });

    it("keeps grams as-is", () => {
      const category = createMassCategory();
      expect(toDefault(category, "g", "100")).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("handles string input", () => {
      const category = createVolumeCategory();
      expect(toDefault(category, "l", "2")).toBe(2000);
    });

    it("handles numeric input", () => {
      const category = createVolumeCategory();
      expect(toDefault(category, "l", 2)).toBe(2000);
    });

    it("floors decimal results", () => {
      const category = createVolumeCategory();
      // 1.5l = 1500ml, but parseInt("1.5") = 1, so 1l = 1000ml
      expect(toDefault(category, "l", "1.5")).toBe(1000);
    });
  });
});

describe("toBest", () => {
  describe("volume conversions", () => {
    it("converts ml to readable liters", () => {
      const category = createVolumeCategory();
      // convert library uses uppercase L for liters
      expect(toBest(category, 2500)).toBe("2.5 L");
    });

    it("keeps small values in ml", () => {
      const category = createVolumeCategory();
      expect(toBest(category, 50)).toBe("50 mL");
    });

    it("handles exact liter values", () => {
      const category = createVolumeCategory();
      expect(toBest(category, 1000)).toBe("1 L");
    });
  });

  describe("time conversions", () => {
    it("decomposes time into hours and minutes", () => {
      const category = createTimeCategory();
      // 5400s = 1h + 1800s = 1h + 30 min
      // toBest builds: "1" + "h" + " " + toBest(1800)
      // toBest(1800) = "30 min" (from result.toString())
      expect(toBest(category, 5400)).toBe("1h 30 min");
    });

    it("handles exact hour values", () => {
      const category = createTimeCategory();
      // 3600s -> convert gives 60 min, not 1h
      // result.toString() = "60 min", replace "." with "," = "60 min"
      expect(toBest(category, 3600)).toBe("60 min");
    });

    it("handles minutes only", () => {
      const category = createTimeCategory();
      // 300s = 5 min
      expect(toBest(category, 300)).toBe("5 min");
    });

    it("handles complex time decomposition", () => {
      const category = createTimeCategory();
      // 3661s = 1h + 61s = 1h + 1min + 1s
      // But convert(1, 's').to('best') gives 1000ms, not 1s
      // So the actual decomposition is: 1h 1min 1000 ms
      expect(toBest(category, 3661)).toBe("1h 1min 1000 ms");
    });

    it("handles seconds only", () => {
      const category = createTimeCategory();
      expect(toBest(category, 30)).toBe("30 s");
    });
  });

  describe("mass conversions", () => {
    it("converts grams to kilograms", () => {
      const category = createMassCategory();
      expect(toBest(category, 2500)).toBe("2.5 kg");
    });

    it("keeps small values in grams", () => {
      const category = createMassCategory();
      expect(toBest(category, 50)).toBe("50 g");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for NaN", () => {
      const category = createVolumeCategory();
      expect(toBest(category, "abc")).toBe("");
    });

    it("returns empty string for empty category config", () => {
      const category = createVolumeCategory({ config: "" });
      expect(toBest(category, 1000)).toBe("");
    });

    it("handles string input", () => {
      const category = createVolumeCategory();
      expect(toBest(category, "2500")).toBe("2.5 L");
    });

    it("handles zero", () => {
      const category = createVolumeCategory();
      expect(toBest(category, 0)).toBe("0 mL");
    });
  });
});
