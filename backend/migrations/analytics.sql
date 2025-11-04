CREATE TABLE user_language_stats_active (
  user_id INT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  total_duration BIGINT,
  lang_percentages JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_language_stats_weekly (
  user_id INT,
  week_start DATE,
  week_end DATE,
  total_duration BIGINT,
  lang_percentages JSONB,
  PRIMARY KEY (user_id, week_start)
);
