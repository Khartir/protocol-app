import { convertMany, getMeasureKind, MeasureKind } from "convert";
import * as Yup from "yup";

// Gültige Einheiten pro Maßtyp (für Fehlermeldungen)
const unitExamples: Record<string, string> = {
  volume: "ml, l, cl, dl",
  time: "s, min, h, d, ms",
  mass: "g, kg, mg",
};

// Mapping von Kategorie-Config zu MeasureKind
const measureKindMap: Record<string, MeasureKind> = {
  volume: MeasureKind.Volume,
  time: MeasureKind.Time,
  mass: MeasureKind.Mass,
};

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

// Spezielle Zeitvalidierung für range-Felder
export function validateDuration(value: string): true | string {
  return validateMeasurement(value, "time");
}

// Yup-Schema für Maßeinheiten-Validierung
export function measurementSchema(measureType?: string) {
  return Yup.string().test("valid-measurement", "", function (value) {
    if (!value || value.trim() === "") return true;

    const result = validateMeasurement(value, measureType);
    if (result === true) return true;

    // Benutzerdefinierte Fehlermeldung zurückgeben
    return this.createError({ message: result });
  });
}

// Yup-Schema für Zeit-Validierung
export function durationSchema() {
  return measurementSchema("time");
}
