import { convertMany, getMeasureKind, MeasureKind } from "convert";
import * as Yup from "yup";

/**
 * Valid unit examples per measure type (for German error messages).
 */
const unitExamples: Record<string, string> = {
  volume: "ml, l, cl, dl",
  time: "s, min, h, d, ms",
  mass: "g, kg, mg",
};

/**
 * Mapping from category config string to convert library MeasureKind.
 */
const measureKindMap: Record<string, MeasureKind> = {
  volume: MeasureKind.Volume,
  time: MeasureKind.Time,
  mass: MeasureKind.Mass,
};

/**
 * Validates a measurement input string for correct format and unit type.
 * Handles German decimal format (comma) by converting to period.
 *
 * @param value - User input string (e.g., "500ml", "2,5 l", "1h 30min")
 * @param measureType - Expected type: "volume", "time", or "mass" (optional)
 * @returns true if valid, or German error message string if invalid
 *
 * @example
 * validateMeasurement("500ml", "volume")   // → true
 * validateMeasurement("2,5 l", "volume")   // → true
 * validateMeasurement("500ml", "time")     // → "Falscher Einheitentyp..."
 * validateMeasurement("abc", "volume")     // → "Ungültige Eingabe..."
 */
export function validateMeasurement(
  value: string,
  measureType?: string
): true | string {
  if (!value || value.trim() === "") {
    return true; // Leere Werte erlauben (Yup.required für Pflichtfelder)
  }

  try {
    const result = convertMany(value.replace(",", ".")).to("best");

    // Prüfe ob der Einheitentyp zum erwarteten Typ passt
    if (measureType && measureKindMap[measureType] !== undefined) {
      const expectedKind = measureKindMap[measureType];
      const actualKind = getMeasureKind(result.unit);

      if (actualKind !== expectedKind) {
        const units = unitExamples[measureType] || "";
        return `Falscher Einheitentyp. Erwartet: ${units}`;
      }
    }

    return true;
  } catch {
    const units = measureType ? unitExamples[measureType] : "";
    return units
      ? `Ungültige Eingabe. Gültige Einheiten: ${units}`
      : "Ungültige Eingabe";
  }
}

/**
 * Convenience wrapper for time validation.
 * Used for duration/range fields.
 *
 * @param value - User input string (e.g., "1h 30min", "90s")
 * @returns true if valid time, or German error message string if invalid
 */
export function validateDuration(value: string): true | string {
  return validateMeasurement(value, "time");
}

/**
 * Creates a Yup validation schema for measurement fields.
 * Integrates with Formik forms for real-time validation.
 *
 * @param measureType - Expected type: "volume", "time", or "mass" (optional)
 * @returns Yup StringSchema with custom measurement validation
 *
 * @example
 * const schema = Yup.object({
 *   amount: measurementSchema("volume").required("Pflichtfeld"),
 * });
 */
export function measurementSchema(measureType?: string) {
  return Yup.string().test("valid-measurement", "", function (value) {
    if (!value || value.trim() === "") return true;

    const result = validateMeasurement(value, measureType);
    if (result === true) return true;

    // Benutzerdefinierte Fehlermeldung zurückgeben
    return this.createError({ message: result });
  });
}

/**
 * Convenience wrapper for time validation as Yup schema.
 * Used for duration/range fields in forms.
 *
 * @returns Yup StringSchema with time validation
 */
export function durationSchema() {
  return measurementSchema("time");
}
