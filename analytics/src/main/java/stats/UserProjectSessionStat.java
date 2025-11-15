package stats;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import models.EnrichedFileSegment;

public class UserProjectSessionStat implements IStat {
	public static final String[] PRIMITIVE_COLUMNS = { "user_id", "project_path", "window_start", "window_end", };
	public static final String[] JSONB_COLUMNS = {};
	public static final String CONFLICT_KEYS = "user_id, project_path, window_start";

	private final int user_id;
	private final String project_path;

	private long total_duration = 0;
	private Instant window_start = null;
	private Instant window_end = null;

	public UserProjectSessionStat(int user_id, String project_path) {
		this.user_id = user_id;
		this.project_path = project_path;
	}

	public int getUserId() {
		return user_id;
	}

	public String getProjectPath() {
		return project_path;
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

	@Override
	public Map<String, Object> asRecord() {
		Map<String, Object> map = new HashMap<>();
		map.put("user_id", user_id);
		map.put("project_path", project_path);
		map.put("work_duration_ms", total_duration);
		map.put("window_start", window_start);
		map.put("window_end", window_end);
		return map;
	}

	public void add(EnrichedFileSegment seg) {
		if (seg.getProject_name() == null)
			return;
		if (!seg.getProject_name().equals(project_path))
			return;

		Instant start = Instant.parse(seg.getStart_time());
		Instant end = Instant.parse(seg.getEnd_time());
		long duration = Duration.between(start, end).toMillis();

		total_duration += duration;

		if (window_start == null || start.isBefore(window_start))
			window_start = start;
		if (window_end == null || end.isAfter(window_end))
			window_end = end;
	}

	public void postProcess(WindowContext ctx) {
		window_start = ctx.getWindowStart();
		window_end = ctx.getWindowEnd();
	}

	@Override
	public String toString() {
		return "UserProjectSessionStat{user_id=" + user_id + ", project='" + project_path + '\'' + ", duration="
				+ total_duration + ", window=[" + window_start + " → " + window_end + "] }";
	}
}
