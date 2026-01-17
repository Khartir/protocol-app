import { describe, it, expect } from "vitest";
import {
  validateMeasurement,
  validateDuration,
  measurementSchema,
  durationSchema,
} from "./measurementValidation";

describe("validateMeasurement", () => {
  describe("empty values", () => {
    it("returns true for empty string", () => {
      expect(validateMeasurement("")).toBe(true);
    });

    it("returns true for whitespace only", () => {
      expect(validateMeasurement("   ")).toBe(true);
    });
  });

  describe("valid volume measurements", () => {
    it("accepts milliliters", () => {
      expect(validateMeasurement("500ml", "volume")).toBe(true);
    });

    it("accepts liters", () => {
      expect(validateMeasurement("2l", "volume")).toBe(true);
    });

    it("accepts German decimal format", () => {
      expect(validateMeasurement("2,5l", "volume")).toBe(true);
    });

    it("accepts value with space", () => {
      expect(validateMeasurement("500 ml", "volume")).toBe(true);
    });

    it("accepts centiliters", () => {
      expect(validateMeasurement("50cl", "volume")).toBe(true);
    });

    it("accepts deciliters", () => {
      expect(validateMeasurement("5dl", "volume")).toBe(true);
    });
  });

  describe("valid time measurements", () => {
    it("accepts seconds", () => {
      expect(validateMeasurement("30s", "time")).toBe(true);
    });

    it("accepts minutes", () => {
      expect(validateMeasurement("5min", "time")).toBe(true);
    });

    it("accepts hours", () => {
      expect(validateMeasurement("2h", "time")).toBe(true);
    });

    it("accepts combined time format", () => {
      expect(validateMeasurement("1h 30min", "time")).toBe(true);
    });

    it("accepts days", () => {
      expect(validateMeasurement("1d", "time")).toBe(true);
    });

    it("accepts milliseconds", () => {
      expect(validateMeasurement("1000ms", "time")).toBe(true);
    });
  });

  describe("valid mass measurements", () => {
    it("accepts grams", () => {
      expect(validateMeasurement("100g", "mass")).toBe(true);
    });

    it("accepts kilograms", () => {
      expect(validateMeasurement("2kg", "mass")).toBe(true);
    });

    it("accepts milligrams", () => {
      expect(validateMeasurement("500mg", "mass")).toBe(true);
    });

    it("accepts German decimal format", () => {
      expect(validateMeasurement("2,5kg", "mass")).toBe(true);
    });
  });

  describe("wrong unit type errors", () => {
    it("rejects volume units for time type", () => {
      const result = validateMeasurement("500ml", "time");
      expect(result).toContain("Falscher Einheitentyp");
    });

    it("rejects time units for volume type", () => {
      const result = validateMeasurement("30s", "volume");
      expect(result).toContain("Falscher Einheitentyp");
    });

    it("rejects mass units for time type", () => {
      const result = validateMeasurement("100g", "time");
      expect(result).toContain("Falscher Einheitentyp");
    });

    it("rejects volume units for mass type", () => {
      const result = validateMeasurement("500ml", "mass");
      expect(result).toContain("Falscher Einheitentyp");
    });
  });

  describe("invalid format errors", () => {
    it("rejects plain text", () => {
      const result = validateMeasurement("abc", "volume");
      expect(result).toContain("Ungültige Eingabe");
    });

    it("rejects numbers without units", () => {
      const result = validateMeasurement("500", "volume");
      expect(result).toContain("Ungültige Eingabe");
    });

    it("rejects invalid unit names", () => {
      const result = validateMeasurement("500xyz", "volume");
      expect(result).toContain("Ungültige Eingabe");
    });

    it("shows valid units in error for volume", () => {
      const result = validateMeasurement("abc", "volume");
      expect(result).toContain("ml, l, cl, dl");
    });

    it("shows valid units in error for time", () => {
      const result = validateMeasurement("abc", "time");
      expect(result).toContain("s, min, h, d, ms");
    });

    it("shows valid units in error for mass", () => {
      const result = validateMeasurement("abc", "mass");
      expect(result).toContain("g, kg, mg");
    });
  });

  describe("without measure type", () => {
    it("accepts any valid measurement", () => {
      expect(validateMeasurement("500ml")).toBe(true);
      expect(validateMeasurement("30s")).toBe(true);
      expect(validateMeasurement("100g")).toBe(true);
    });

    it("rejects invalid input", () => {
      const result = validateMeasurement("abc");
      expect(result).toBe("Ungültige Eingabe");
    });
  });
});

describe("validateDuration", () => {
  it("validates time measurements", () => {
    expect(validateDuration("30s")).toBe(true);
    expect(validateDuration("1h 30min")).toBe(true);
  });

  it("rejects non-time measurements", () => {
    const result = validateDuration("500ml");
    expect(result).toContain("Falscher Einheitentyp");
  });
});

describe("measurementSchema", () => {
  it("validates empty string", async () => {
    const schema = measurementSchema("volume");
    await expect(schema.validate("")).resolves.toBe("");
  });

  it("validates valid measurement", async () => {
    const schema = measurementSchema("volume");
    await expect(schema.validate("500ml")).resolves.toBe("500ml");
  });

  it("rejects invalid measurement", async () => {
    const schema = measurementSchema("volume");
    await expect(schema.validate("abc")).rejects.toThrow();
  });

  it("rejects wrong unit type", async () => {
    const schema = measurementSchema("volume");
    await expect(schema.validate("30s")).rejects.toThrow();
  });
});

describe("durationSchema", () => {
  it("validates time measurements", async () => {
    const schema = durationSchema();
    await expect(schema.validate("30s")).resolves.toBe("30s");
  });

  it("rejects non-time measurements", async () => {
    const schema = durationSchema();
    await expect(schema.validate("500ml")).rejects.toThrow();
  });
});
