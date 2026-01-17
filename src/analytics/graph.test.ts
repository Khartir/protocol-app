import { describe, it, expect } from "vitest";
import { graphCollection, Graph } from "./graph";

describe("graphCollection migration", () => {
  describe("v2 to v3 migration", () => {
    it("adds aggregationMode: 'daily' to existing graphs", () => {
      const oldGraph = {
        id: "test-id",
        name: "Test Graph",
        type: "line",
        category: "cat-id",
        range: "604800",
        config: { upperLimit: "100" },
        order: 0,
      };

      const migrated = graphCollection.migrationStrategies[3](oldGraph as Graph);

      expect(migrated.config.aggregationMode).toBe("daily");
    });

    it("adds weekStartDay: 1 (Monday) to existing graphs", () => {
      const oldGraph = {
        id: "test-id",
        name: "Test Graph",
        type: "line",
        category: "cat-id",
        range: "604800",
        config: {},
        order: 0,
      };

      const migrated = graphCollection.migrationStrategies[3](oldGraph as Graph);

      expect(migrated.config.weekStartDay).toBe(1);
    });

    it("preserves existing config properties", () => {
      const oldGraph = {
        id: "test-id",
        name: "Test Graph",
        type: "table",
        category: "cat-id",
        range: "2592000",
        config: { upperLimit: "200", lowerLimit: "50" },
        order: 5,
      };

      const migrated = graphCollection.migrationStrategies[3](oldGraph as Graph);

      expect(migrated.config.upperLimit).toBe("200");
      expect(migrated.config.lowerLimit).toBe("50");
    });

    it("preserves all non-config fields", () => {
      const oldGraph = {
        id: "graph-123",
        name: "Water Intake",
        type: "line",
        category: "water-cat",
        range: "604800",
        config: {},
        order: 3,
      };

      const migrated = graphCollection.migrationStrategies[3](oldGraph as Graph);

      expect(migrated.id).toBe("graph-123");
      expect(migrated.name).toBe("Water Intake");
      expect(migrated.type).toBe("line");
      expect(migrated.category).toBe("water-cat");
      expect(migrated.range).toBe("604800");
      expect(migrated.order).toBe(3);
    });
  });

  describe("v3 to v4 migration", () => {
    it("adds xAxisScaleType: 'time' to existing graphs", () => {
      const oldGraph = {
        id: "test-id",
        name: "Test Graph",
        type: "line",
        category: "cat-id",
        range: "604800",
        config: { aggregationMode: "daily", weekStartDay: 1 },
        order: 0,
      };

      const migrated = graphCollection.migrationStrategies[4](oldGraph as Graph);

      expect(migrated.config.xAxisScaleType).toBe("time");
    });

    it("preserves existing config properties including aggregation settings", () => {
      const oldGraph = {
        id: "test-id",
        name: "Test Graph",
        type: "line",
        category: "cat-id",
        range: "604800",
        config: {
          upperLimit: "100",
          lowerLimit: "50",
          aggregationMode: "weekly",
          weekStartDay: 0,
        },
        order: 0,
      };

      const migrated = graphCollection.migrationStrategies[4](oldGraph as Graph);

      expect(migrated.config.upperLimit).toBe("100");
      expect(migrated.config.lowerLimit).toBe("50");
      expect(migrated.config.aggregationMode).toBe("weekly");
      expect(migrated.config.weekStartDay).toBe(0);
      expect(migrated.config.xAxisScaleType).toBe("time");
    });

    it("preserves all non-config fields", () => {
      const oldGraph = {
        id: "graph-456",
        name: "Exercise",
        type: "table",
        category: "exercise-cat",
        range: "2592000",
        config: { aggregationMode: "monthly", weekStartDay: 1 },
        order: 5,
      };

      const migrated = graphCollection.migrationStrategies[4](oldGraph as Graph);

      expect(migrated.id).toBe("graph-456");
      expect(migrated.name).toBe("Exercise");
      expect(migrated.type).toBe("table");
      expect(migrated.category).toBe("exercise-cat");
      expect(migrated.range).toBe("2592000");
      expect(migrated.order).toBe(5);
    });
  });
});
