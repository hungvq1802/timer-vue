<template>
    <div class="wrapper">
        <h1>TIMER</h1>

        <div class="controls">
            <label>
                Choose start date/time:
                <input class="date-input" type="datetime-local" :value="selectedStr ?? ''" @input="onSelectedDate" />
            </label>

            <button @click="clearSelection" id="clear" aria-label="Clear selection" class="bg-red"
                :disabled="!selectedStr">Clear</button>

            <div class="months">
                <span>Disable months:</span>
                <multiselect v-model="disabledMonths" :options="options" :multiple="true" :close-on-select="false"
                    :clear-on-select="false" placeholder="Select months" label="label" track-by="value"></multiselect>
            </div>

            <div class="actions">
                <button @click="start" :disabled="running" id="start" class="bg-green">{{ paused ? "Resume" : "Start"
                    }}</button>
                <button @click="pause" :disabled="!running" id="pause" class="bg-blue">Pause</button>
                <button @click="stop" :disabled="!running" id="stop" class="bg-red">Stop</button>
                <button @click="reset" id="reset" class="bg-yellow">Reset</button>
            </div>

            <h3 v-if="error" id="error" class="text-red">{{ error }}</h3>
        </div>

        <div class="display">
            <div>
                <p v-if="running" class="text-green" id="status" style="margin: 0 auto">Timer is running</p>
                <p v-else-if="paused" class="text-blue" id="status" style="margin: 0 auto">Timer paused</p>
                <p v-else-if="pending" class="text-blue" id="status" style="margin: 0 auto">{{ pending }}</p>
                <p v-else class="text-red" id="status" style="margin: 0 auto">Timer stop</p>
            </div>
            <div class="seconds">{{ elapsed }}</div>
            <div class="hms">{{ formatHMS(elapsed) }}</div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
import { secondsBetween, formatHMS } from '../utils/helper';
export default {
    setup() {
        type Month = {
            label: string;
            value: number;
        }
        const selectedStr = ref<string | null>(null)
        const error = ref<string | null>(null);
        const pending = ref<string | null>(null);
        const disabledMonths = ref<Month[]>([]);
        const running = ref(false);
        const paused = ref(false);
        const elapsed = ref(0);
        let t: number | null = null;
        let countdownInterval: number | null = null;
        let anchorMs = 0;

        const options = Array.from({ length: 12 }, (_, i) => ({
            value: i,
            label: new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' })
        }));

        const selectedDate = computed<Date | null>(() => {
            if (!selectedStr.value) return null;
            const [d, hm] = selectedStr.value.split("T");
            const [y, m, day] = d.split("-").map(Number);
            const [hh, mm] = hm.split(":").map(Number);
            return new Date(y, m - 1, day, hh, mm, 0, 0);
        });

        const onSelectedDate = (e: Event) => {
            const target = e.target as HTMLInputElement
            selectedStr.value = target.value || null
        }

        const monthIsDisabled = (d: Date | null) => {
            if (!d) return false;
            const selectedMonths = disabledMonths.value.map(m => m.value)
            return selectedMonths.includes(d.getMonth() as number);
        }

        const start = () => {
            const now = new Date();
            if (!paused.value) {
                if (selectedDate.value && monthIsDisabled(selectedDate.value)) {
                    error.value = "This month is disabled.";
                    return;
                }
                error.value = null;

                const base = selectedDate.value ?? now;
                if (base.getTime() > now.getTime()) {
                    let remainingSeconds = secondsBetween(now, base);
                    pending.value = `Timer will start in ${formatHMS(remainingSeconds)}`;
                    elapsed.value = 0

                    if (countdownInterval != null) {
                        clearInterval(countdownInterval);
                    }

                    countdownInterval = window.setInterval(() => {
                        remainingSeconds = secondsBetween(new Date(), base);
                        if (remainingSeconds <= 0 && countdownInterval != null) {
                            clearInterval(countdownInterval);
                            countdownInterval = null;
                            pending.value = null;
                            elapsed.value = 0;
                            anchorMs = Date.now();
                            t = window.setInterval(() => {
                                elapsed.value = Math.floor((Date.now() - anchorMs) / 1000);
                            }, 1000);
                            running.value = true;
                        } else {
                            pending.value = `Timer will start in ${formatHMS(remainingSeconds)}`;
                        }
                    }, 1000);
                } else {
                    pending.value = null;
                    const initial = secondsBetween(base, now);
                    elapsed.value = initial;
                    anchorMs = Date.now() - initial * 1000;
                    t = window.setInterval(() => {
                        elapsed.value = Math.floor((Date.now() - anchorMs) / 1000);
                    }, 1000);
                    running.value = true;
                }
            } else {
                anchorMs = Date.now() - elapsed.value * 1000;
                t = window.setInterval(() => {
                    elapsed.value = Math.floor((Date.now() - anchorMs) / 1000);
                }, 1000);
                running.value = true;
                paused.value = false;
            }
        }

        const stop = () => {
            if (t != null) {
                clearInterval(t);
                t = null;
            }
            if (countdownInterval != null) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            running.value = false;
            paused.value = false;
            pending.value = null;
        }

        const pause = () => {
            if (t != null) {
                clearInterval(t);
                t = null;
            }
            running.value = false;
            paused.value = true;
        };

        const reset = () => {
            stop();
            elapsed.value = 0;
            error.value = null;
            pending.value = null;
        }

        const clearSelection = () => {
            selectedStr.value = null
            error.value = null
        }

        return {
            selectedStr,
            error,
            pending,
            disabledMonths,
            running,
            paused,
            elapsed,
            options,
            secondsBetween,
            formatHMS,
            onSelectedDate,
            clearSelection,
            start,
            stop,
            reset,
            pause
        }
    }
}
</script>

<style scoped>
h1 {
    line-height: 0.5;
}

h3 {
    margin: 10px auto;
}

.wrapper {
    max-width: 680px;
    margin: 0 auto;
    padding: 16px;
}

.date-input {
    padding: 5px;
}

.controls {
    display: grid;
    gap: 12px;
    align-items: center;
}

.actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}

.months {
    display: grid;
    gap: 6px;
}

.months select {
    height: 85px;
}

.display {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid #eee;
    border-radius: 12px;
    text-align: center;
}

.seconds {
    font-size: 48px;
    font-weight: 700;
}

.hms {
    opacity: 0.7;
    margin-top: 4px;
}

.text-green {
    color: #198754;
}

.text-red {
    color: #dc3545;
}

.text-blue {
    color: #0dcaf0;
}

.bg-green {
    background-color: #198754;
}

.bg-red {
    background-color: #dc3545;
}

.bg-blue {
    background-color: #0dcaf0;
}

.bg-yellow {
    background-color: #664d03;
}


@media (max-width: 480px) {
    .wrapper {
        padding: 12px;
    }

    .seconds {
        font-size: 36px;
    }

    .date-input {
        width: -webkit-fill-available;
        ;
    }

    button {
        font-size: 0.8em;
    }

}
</style>