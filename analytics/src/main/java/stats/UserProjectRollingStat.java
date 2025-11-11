package stats;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import models.EnrichedFileSegment;

public class UserProjectRollingStat implements IStat {
	public static final String[] PRIMITIVE_COLUMNS = { "user_id", "project_path", "window_type", };
	public static final String[] JSONB_COLUMNS = { "lang_durations", "machine_durations", "editor_durations",
			"activity_durations", "files_durations" };
	public static final String[] CONFLICT_KEYS = { "user_id", "project_path", "window_type" };
	private final int user_id;
	private final String project_path;
	private long total_duration;
	private String window_type;

	private final HashMap<String, Long> machine_durations = new HashMap<>();
	private final HashMap<String, Long> language_durations = new HashMap<>();
	private final HashMap<String, Long> editor_durations = new HashMap<>();
	private final HashMap<String, Long> project_durations = new HashMap<>();
	private final HashMap<String, Long> activity_durations = new HashMap<>();
	private final HashMap<String, Long> files_durations = new HashMap<>();

	public UserProjectRollingStat(int user_id, String project_path) {
		this.user_id = user_id;
		this.project_path = project_path;
		this.total_duration = 0;
	}

	public void setWindowType(String window_type) {
		this.window_type = window_type;
	}

	public String getWindowType() {
		return this.window_type;
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

	public HashMap<String, Long> getMachineDurations() {
		return machine_durations;
	}

	public HashMap<String, Long> getLangDurations() {
		return language_durations;
	}

	public HashMap<String, Long> getEditorDurations() {
		return editor_durations;
	}

	public HashMap<String, Long> getProjectDurations() {
		return project_durations;
	}

	public HashMap<String, Long> getActivityDurations() {
		return activity_durations;
	}

	public HashMap<String, Long> getFilesDurations() {
		return files_durations;
	}

	@Override
	public Map<String, Object> asRecord() {
		Map<String, Object> map = new HashMap<>();
		map.put("user_id", this.user_id);
		map.put("project_path", this.project_path);
		map.put("window_type", this.window_type);
		map.put("lang_durations", this.language_durations);
		map.put("machine_durations", this.machine_durations);
		map.put("editor_durations", this.editor_durations);
		map.put("project_durations", this.project_durations);
		map.put("activity_durations", this.activity_durations);
		map.put("file_durations", this.files_durations);
		return map;
	}

	public void add(EnrichedFileSegment seg) {
		long duration = Duration.between(Instant.parse(seg.getStart_time()), Instant.parse(seg.getEnd_time()))
				.toMillis();

		this.total_duration += duration;

		if (seg.getLang() != null)
			language_durations.merge(seg.getLang(), duration, Long::sum);

		if (seg.getEditor() != null)
			editor_durations.merge(seg.getEditor(), duration, Long::sum);

		if (seg.getMachine_name() != null)
			machine_durations.merge(seg.getMachine_name(), duration, Long::sum);

		if (seg.getProject_name() != null)
			project_durations.merge(seg.getProject_name(), duration, Long::sum);

		if (seg.getSegment_type() != null)
			activity_durations.merge(seg.getSegment_type(), duration, Long::sum);

		if (seg.getFile_path() != null)
			files_durations.merge(seg.getFile_path(), duration, Long::sum);
	}

	public void postProcess(WindowContext ctx) {
		setWindowType(ctx.getWindowType());
	}

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append("UserProjectStat{user_id=").append(user_id).append(", project_path=").append(project_path)
				.append(", total_duration=").append(total_duration).append(" ms");

		appendCategory(sb, "files", files_durations);
		appendCategory(sb, "languages", language_durations);
		appendCategory(sb, "machines", machine_durations);
		appendCategory(sb, "projects", project_durations);
		appendCategory(sb, "activities", activity_durations);
		appendCategory(sb, "editor", editor_durations);

		sb.append("}");
		return sb.toString();
	}

	private void appendCategory(StringBuilder sb, String name, HashMap<String, Long> durations) {
		if (!durations.isEmpty()) {
			sb.append(", ").append(name).append("={");
			for (Map.Entry<String, Long> entry : durations.entrySet()) {
				double percent = (total_duration > 0) ? (entry.getValue() * 100.0 / total_duration) : 0.0;
				sb.append(entry.getKey()).append(": ").append(String.format("%.2f%%", percent)).append(" (")
						.append(entry.getValue()).append(" ms), ");
			}
			sb.setLength(sb.length() - 2);
			sb.append("}");
		}
	}
}
