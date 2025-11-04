package file_segment_analytics;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import models.EnrichedFileSegment;

public class UserLanguageStat {
	private int user_id;
	private long total_duration;
	private Instant window_start;
	private Instant window_end;

	private HashMap<String, Long> lang_durations = new HashMap<>();

	public UserLanguageStat(int user_id) {
		this.user_id = user_id;
		this.total_duration = 0;
		this.window_start = Instant.now();
		this.window_end = Instant.now();
	}

	public int getUserId() {
		return user_id;
	}

	public long getTotalDuration() {
		return total_duration;
	}

	public Instant getWindowStart() {
		return window_start;
	}

	public Instant getWindowEnd() {
		return window_end;
	}

	public void setWindowStart(Instant start) {
		this.window_start = start;
	}

	public void setWindowEnd(Instant end) {
		this.window_end = end;
	}

	public void add(EnrichedFileSegment seg) {
		long duration = Duration.between(Instant.parse(seg.getStart_time()), Instant.parse(seg.getEnd_time()))
				.toMillis();
		this.total_duration += duration;
		lang_durations.merge(seg.getLang(), duration, Long::sum);

		// expand window boundaries dynamically
		Instant start = Instant.parse(seg.getStart_time());
		Instant end = Instant.parse(seg.getEnd_time());
		if (window_start == null || start.isBefore(window_start))
			window_start = start;
		if (window_end == null || end.isAfter(window_end))
			window_end = end;
	}

	public void remove(EnrichedFileSegment seg) {
		long dur = Duration.between(Instant.parse(seg.getStart_time()), Instant.parse(seg.getEnd_time())).toMillis();
		this.total_duration -= dur;
		this.lang_durations.computeIfPresent(seg.getLang(), (k, v) -> v - dur <= 0 ? null : v - dur);
	}

	public HashMap<String, Double> getLanguagePercentages() {
		HashMap<String, Double> result = new HashMap<>();
		for (var entry : lang_durations.entrySet()) {
			double percent = (entry.getValue() * 100.0) / total_duration;
			result.put(entry.getKey(), percent);
		}
		return result;
	}

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append("UserLanguageStat{").append("user_id=").append(user_id).append(", total_duration=")
				.append(total_duration).append(" ms");

		if (window_start != null && window_end != null) {
			sb.append(", window=[").append(window_start).append(" → ").append(window_end).append("]");
		}

		if (!lang_durations.isEmpty()) {
			sb.append(", languages={");
			for (Map.Entry<String, Long> entry : lang_durations.entrySet()) {
				double percent = (total_duration > 0) ? (entry.getValue() * 100.0 / total_duration) : 0.0;
				sb.append(entry.getKey()).append(": ").append(String.format("%.2f%%", percent)).append(" (")
						.append(entry.getValue()).append(" ms), ");
			}
			sb.setLength(sb.length() - 2);
			sb.append("}");
		}

		sb.append("}");
		return sb.toString();
	}
}
