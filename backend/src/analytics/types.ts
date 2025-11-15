import Prettify from "@/utils/prettify";

type Duration<Key extends string = string> = {
  [K in Key]: number;
};

export type UserAnalytics = Prettify<{
  lang_durations: Duration;
  project_durations: Duration;
  editor_durations: Duration;
  activity_durations: Duration;
  machine_durations: Duration;
  work_duration_ms: number;
  active_days: number;
}>;
