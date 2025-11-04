package file_segment_analytics;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import models.EnrichedFileSegment;

public class UserLanguageStat {
	private int user_id;
	private long total_duration;

	private HashMap<String, Long> lang_durations = new HashMap<>();

	public UserLanguageStat(int user_id) {
		this.user_id = user_id;
		this.total_duration = 0;
	}

	public void add(EnrichedFileSegment seg) {
		long duration = Duration.between(Instant.parse(seg.getStart_time()), Instant.parse(seg.getEnd_time()))
				.toMillis();
		this.total_duration += duration;
		lang_durations.merge(seg.getLang(), duration, Long::sum);
	}

	// Used for removing stale data in a window
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

		if (!lang_durations.isEmpty()) {
			sb.append(", languages={");
			for (Map.Entry<String, Long> entry : lang_durations.entrySet()) {
				double percent = (total_duration > 0) ? (entry.getValue() * 100.0 / total_duration) : 0.0;
				sb.append(entry.getKey()).append(": ").append(String.format("%.2f%%", percent)).append(" (")
						.append(entry.getValue()).append(" ms), ");
			}
			// remove trailing comma
			sb.setLength(sb.length() - 2);
			sb.append("}");
		}

		sb.append("}");
		return sb.toString();
	}
}
