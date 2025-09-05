import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Timer from "../components/Timer.vue";

//convert UTC to Local Date/Time
function toLocalDatetimeInput(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

describe("Timer.vue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const mountTimer = () =>
    mount(Timer, {
      global: {
        stubs: {
          Multiselect: true,
        },
      },
    });

  it("renders the timer UI", () => {
    const wrapper = mountTimer();
    expect(wrapper.find("h1").text()).toBe("TIMER");
    expect(wrapper.find("#clear").exists()).toBe(true);
    expect(wrapper.find("#start").exists()).toBe(true);
    expect(wrapper.find("#pause").exists()).toBe(true);
    expect(wrapper.find("#stop").exists()).toBe(true);
    expect(wrapper.find("#reset").exists()).toBe(true);
    expect(wrapper.find(".months span").text()).toBe("Disable months:");
    expect(wrapper.find(".seconds").text()).toBe("0");
    expect(wrapper.find(".hms").text()).toBe("00:00:00");
    expect(wrapper.find("#status").text()).toBe("Timer stop");
  });

  it("starts immediately when no date is selected", async () => {
    const wrapper = mountTimer();
    await wrapper.find("#start").trigger("click");

    expect(wrapper.find("#status").text()).toBe("Timer is running");

    await vi.advanceTimersByTime(2000);
    expect(Number(wrapper.find(".seconds").text())).toBeGreaterThanOrEqual(2);
  });

  it("starts from a past selected date", async () => {
    const wrapper = mountTimer();
    const past = new Date(Date.now() - 10000);
    const str = toLocalDatetimeInput(past);
    await wrapper.find("input[type='datetime-local']").setValue(str);

    await wrapper.find("#start").trigger("click");
    expect(Number(wrapper.find(".seconds").text())).toBeGreaterThanOrEqual(10);
  });

  it("shows pending countdown for a future selected date", async () => {
    const wrapper = mountTimer();

    const future = new Date(Date.now() + 120000);
    const str = toLocalDatetimeInput(future);
    await wrapper.find("input[type='datetime-local']").setValue(str);

    await wrapper.find("#start").trigger("click");

    expect(wrapper.find("#status").text()).toContain("Timer will start in");

    await vi.advanceTimersByTime(120000);
    expect(wrapper.find("#status").text()).toBe("Timer is running");
  });

  it("shows error if month is disabled", async () => {
    const wrapper = mountTimer();

    // pick January
    const date = new Date(2025, 0, 1, 10, 0);
    const str = date.toISOString().slice(0, 16);
    await wrapper.find("input[type='datetime-local']").setValue(str);

    await wrapper.vm.disabledMonths.push({ value: 0, label: "January" });

    await wrapper.find("#start").trigger("click");

    expect(wrapper.find("#error").text()).toBe("This month is disabled.");
  });

  it("pauses and resumes the timer", async () => {
    const wrapper = mountTimer();

    await wrapper.find("#start").trigger("click");
    await vi.advanceTimersByTime(2000);

    await wrapper.find("#pause").trigger("click");
    expect(wrapper.find("#status").text()).toBe("Timer paused");

    const pausedValue = Number(wrapper.find(".seconds").text());

    await vi.advanceTimersByTime(3000);
    expect(Number(wrapper.find(".seconds").text())).toBe(pausedValue);

    await wrapper.find("#start").trigger("click");
    await vi.advanceTimersByTime(2000);
    expect(Number(wrapper.find(".seconds").text())).toBeGreaterThanOrEqual(
      pausedValue + 2
    );
  });

  it("stops the timer", async () => {
    const wrapper = mountTimer();

    await wrapper.find("#start").trigger("click");
    vi.advanceTimersByTime(2000);

    await wrapper.find("#stop").trigger("click");
    expect(wrapper.find("#status").text()).toBe("Timer stop");
  });

  it("resets the timer", async () => {
    const wrapper = mountTimer();

    await wrapper.find("#start").trigger("click");
    vi.advanceTimersByTime(2000);

    await wrapper.find("#reset").trigger("click");
    expect(wrapper.find(".seconds").text()).toBe("0");
    expect(wrapper.find(".hms").text()).toBe("00:00:00");
    expect(wrapper.find("#status").text()).toBe("Timer stop");
  });

  it("clears the selected date", async () => {
    const wrapper = mountTimer();

    const now = new Date();
    const str = now.toISOString().slice(0, 16);
    await wrapper.find("input[type='datetime-local']").setValue(str);

    await wrapper.find("#clear").trigger("click");
    expect(wrapper.vm.selectedStr).toBe(null);
  });

  it("displays formatted hms correctly", async () => {
    const wrapper = mountTimer();
    wrapper.vm.elapsed = 3671;
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".hms").text()).toBe("01:01:11");
  });
});
