package stats;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import models.EnrichedFileSegment;

public class UserLangSessionStat implements IStat {

	public static final String[] PRIMITIVE_COLUMNS = { "user_id", "lang", "window_start", "window_end",
			"work_duration_ms" };
	public static final String[] JSONB_COLUMNS = {};
	public static final String CONFLICT_KEYS = "user_id, lang, window_start";

	private final int user_id;
	private final String lang;

	private long total_duration = 0;
	private Instant window_start = null;
	private Instant window_end = null;

	public UserLangSessionStat(int user_id, String lang) {
		this.user_id = user_id;
		this.lang = lang;
	}

	public int getUserId() {
		return user_id;
	}

	public String getLang() {
		return lang;
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
		map.put("lang", lang);
		map.put("work_duration_ms", total_duration);
		map.put("window_start", window_start);
		map.put("window_end", window_end);
		return map;
	}

	public void add(EnrichedFileSegment seg) {
		if (seg.getLang() == null)
			return;
		if (!seg.getLang().equals(lang))
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
		return "UserLangSessionStat{user_id=" + user_id + ", lang='" + lang + '\'' + ", duration=" + total_duration
				+ ", window=[" + window_start + " → " + window_end + "] }";
	}
}
