import { describe, it, expect } from "vitest";
import { requiresInput, requiresMeasure, categoryTypes } from "./category";

describe("requiresInput", () => {
  it("returns false for todo type", () => {
    expect(requiresInput("todo")).toBe(false);
  });

  it("returns true for value type", () => {
    expect(requiresInput("value")).toBe(true);
  });

  it("returns true for valueAccumulative type", () => {
    expect(requiresInput("valueAccumulative")).toBe(true);
  });

  it("returns true for protocol type", () => {
    expect(requiresInput("protocol")).toBe(true);
  });

  it("returns true for unknown type", () => {
    expect(requiresInput("unknown")).toBe(true);
  });
});

describe("requiresMeasure", () => {
  it("returns false for todo type", () => {
    expect(requiresMeasure("todo")).toBe(false);
  });

  it("returns false for protocol type", () => {
    expect(requiresMeasure("protocol")).toBe(false);
  });

  it("returns true for value type", () => {
    expect(requiresMeasure("value")).toBe(true);
  });

  it("returns true for valueAccumulative type", () => {
    expect(requiresMeasure("valueAccumulative")).toBe(true);
  });

  it("returns true for unknown type", () => {
    expect(requiresMeasure("unknown")).toBe(true);
  });
});

describe("categoryTypes", () => {
  it("has German label for todo", () => {
    expect(categoryTypes.todo).toBe("Aufgabe");
  });

  it("has German label for value", () => {
    expect(categoryTypes.value).toBe("Mit einfachem Messwert");
  });

  it("has German label for valueAccumulative", () => {
    expect(categoryTypes.valueAccumulative).toBe("Mit summiertem Messwert");
  });

  it("has German label for protocol", () => {
    expect(categoryTypes.protocol).toBe("Protokoll");
  });

  it("has exactly 4 category types", () => {
    expect(Object.keys(categoryTypes)).toHaveLength(4);
  });
});
