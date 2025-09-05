import { describe, it, expect } from "vitest";
import { secondsBetween, formatHMS } from "../utils/helper";

describe("secondsBetween", () => {
  it("returns difference in seconds", () => {
    const past = new Date("2025-09-05T10:00:00Z");
    const now = new Date("2025-09-05T10:00:10Z");

    expect(secondsBetween(past, now)).toBe(10);
  });

  it("never returns negative", () => {
    const future = new Date("2025-09-05T10:00:10Z");
    const now = new Date("2025-09-05T10:00:00Z");

    expect(secondsBetween(future, now)).toBe(0);
  });
});

describe("formatHMS", () => {
  it("formats seconds into hh:mm:ss", () => {
    expect(formatHMS(5)).toBe("00:00:05");
    expect(formatHMS(75)).toBe("00:01:15");
    expect(formatHMS(3671)).toBe("01:01:11");
  });

  it("pads numbers correctly", () => {
    expect(formatHMS(9)).toBe("00:00:09");
    expect(formatHMS(600)).toBe("00:10:00");
  });
});
