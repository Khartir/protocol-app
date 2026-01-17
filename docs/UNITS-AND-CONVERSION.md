# Units and Measurement Conversion

This document describes the unit conversion system used for measurement tracking in Protokol App.

## Overview

The app supports three types of measurements:
- **Volume** (Volumen): ml, l, cl, dl
- **Time** (Zeit): s, min, h, d, ms
- **Mass** (Masse): g, kg, mg

Unit conversion is powered by the `convert` package.

## Storage Format

All values are stored in **default units**:

| Measure Type | Default Unit | Storage Format |
|--------------|--------------|----------------|
| Volume | `ml` (milliliters) | Integer |
| Time | `s` (seconds) | Integer |
| Mass | `g` (grams) | Integer |

Example: 2.5 liters is stored as `2500` (ml)

## Key Files

- `src/MeasureSelect.tsx` - Unit type selector and conversion functions
- `src/measurementValidation.ts` - Input validation with German error messages

---

## Conversion Functions

### `getDefaultUnit(category)`

Returns the default storage unit for a category.

```typescript
export const getDefaultUnit = (category: Category) => defaults[category.config];

// defaults = { volume: "ml", time: "s", mass: "g" }
```

**Parameters:**
- `category` - Category object with `config` field ("volume", "time", or "mass")

**Returns:** Unit string ("ml", "s", or "g")

---

### `toDefault(category, unit, value)`

Converts user input to the default storage unit.

```typescript
export const toDefault = (
  category: Category,
  unit: Unit,
  value: string | Number
) => {
  return Math.floor(
    convert(Number.parseInt(value.toString()), unit).to(getDefaultUnit(category))
  );
};
```

**Parameters:**
- `category` - Category object
- `unit` - Source unit (e.g., "l", "min", "kg")
- `value` - Numeric value as string or number

**Returns:** Integer value in default unit

**Examples:**
```typescript
// 2 liters → 2000 ml
toDefault(volumeCategory, "l", "2")  // → 2000

// 5 minutes → 300 seconds
toDefault(timeCategory, "min", "5")  // → 300

// 1.5 kg → 1500 g
toDefault(massCategory, "kg", "1.5") // → 1500
```

---

### `toBest(category, value)`

Converts stored value to the most readable unit for display.

```typescript
export const toBest = (category: Category, value: string | Number): string
```

**Parameters:**
- `category` - Category object
- `value` - Value in default storage unit

**Returns:** Formatted string with best unit

**Special handling for time:**
- Time values use recursive decomposition for human-readable output
- Example: 3661 seconds → "1h 1min 1s"

**Examples:**
```typescript
// Volume: best readable unit
toBest(volumeCategory, 2500)   // → "2.5 l"
toBest(volumeCategory, 50)     // → "50 ml"

// Time: decomposed format
toBest(timeCategory, 3661)     // → "1h 1min 1s"
toBest(timeCategory, 90)       // → "1min 30s"

// Mass: best readable unit
toBest(massCategory, 1500)     // → "1.5 kg"
toBest(massCategory, 250)      // → "250 g"
```

**Note:** Returns German decimal format (comma instead of period): `"1,5 l"`

---

## Validation Functions

### `validateMeasurement(value, measureType)`

Validates user input for correct unit type.

```typescript
export function validateMeasurement(
  value: string,
  measureType?: string
): true | string
```

**Parameters:**
- `value` - User input string (e.g., "500ml", "2.5 l", "1h 30min")
- `measureType` - Expected type: "volume", "time", or "mass" (optional)

**Returns:**
- `true` if valid
- Error message string (German) if invalid

**Validation rules:**
1. Empty values are allowed (use Yup `required` for mandatory fields)
2. Parses input using `convertMany()` which handles compound values
3. If `measureType` provided, validates unit matches expected type

**German error messages:**
- `"Falscher Einheitentyp. Erwartet: ml, l, cl, dl"` - Wrong unit type
- `"Ungültige Eingabe. Gültige Einheiten: s, min, h, d, ms"` - Invalid input

**Examples:**
```typescript
validateMeasurement("500ml", "volume")     // → true
validateMeasurement("2.5 l", "volume")     // → true
validateMeasurement("1h 30min", "time")    // → true
validateMeasurement("500ml", "time")       // → "Falscher Einheitentyp..."
validateMeasurement("abc", "volume")       // → "Ungültige Eingabe..."
```

---

### `validateDuration(value)`

Convenience wrapper for time validation.

```typescript
export function validateDuration(value: string): true | string {
  return validateMeasurement(value, "time");
}
```

---

### `measurementSchema(measureType)`

Creates a Yup validation schema for form integration.

```typescript
export function measurementSchema(measureType?: string) {
  return Yup.string().test("valid-measurement", "", function (value) {
    if (!value || value.trim() === "") return true;
    const result = validateMeasurement(value, measureType);
    if (result === true) return true;
    return this.createError({ message: result });
  });
}
```

**Usage with Formik:**
```typescript
const validationSchema = Yup.object({
  amount: measurementSchema("volume").required("Pflichtfeld"),
});
```

---

### `durationSchema()`

Convenience wrapper for time validation schema.

```typescript
export function durationSchema() {
  return measurementSchema("time");
}
```

---

## German Number Format

The app uses German number formatting:
- Decimal separator: `,` (comma)
- Input accepts both `.` and `,`
- Output uses `,`

**Conversion in validation:**
```typescript
convertMany(value.replace(",", ".")).to("best")
```

**Display formatting:**
```typescript
result.toString().replace(".", ",")  // "2.5 l" → "2,5 l"
```

---

## MeasureSelect Component

React component for selecting measure type in category forms.

```typescript
export const MeasureSelect = () => {
  const formik = useFormikContext<Category>();
  if (!requiresMeasure(formik.values.type)) {
    return <></>;
  }
  // Renders select dropdown
}
```

**Options:**
| Value | German Label |
|-------|--------------|
| `volume` | Volumen |
| `time` | Zeit |
| `mass` | Masse |

**Visibility:** Only renders for category types that require measurement (`value`, `valueAccumulative`)

---

## Unit Examples by Type

### Volume
- `50ml` - 50 milliliters
- `2.5l` or `2,5l` - 2.5 liters
- `1cl` - 1 centiliter
- `5dl` - 5 deciliters

### Time
- `30s` - 30 seconds
- `5min` - 5 minutes
- `2h` - 2 hours
- `1d` - 1 day
- `1h 30min` - compound: 1 hour 30 minutes
- `100ms` - 100 milliseconds

### Mass
- `500g` - 500 grams
- `1.5kg` or `1,5kg` - 1.5 kilograms
- `250mg` - 250 milligrams

---

## Integration with Categories

Categories store their measure type in the `config` field:

```typescript
// Category with volume measurement
{
  id: "water-intake",
  name: "Wasseraufnahme",
  type: "valueAccumulative",
  config: "volume",  // ← measure type
  // ...
}
```

**Type requirements:**

| Category Type | Requires Measurement |
|---------------|---------------------|
| `todo` | No |
| `value` | Yes |
| `valueAccumulative` | Yes |
| `protocol` | No |

Check with:
```typescript
requiresMeasure(category.type)  // true/false
```

---

## Data Flow Example

**User enters:** `"2,5 l"` for water intake

1. **Validation:** `validateMeasurement("2,5 l", "volume")` → `true`
2. **Storage conversion:** `toDefault(category, "l", 2.5)` → `2500`
3. **Database:** Event stored with `data: "2500"`
4. **Display:** `toBest(category, 2500)` → `"2,5 l"`
