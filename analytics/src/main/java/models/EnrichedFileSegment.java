package models;

import java.io.Serializable;
import java.util.Objects;

public class EnrichedFileSegment implements Serializable {

	// Segment info
	private int segment_id;
	private String start_time;
	private String end_time;
	private Double duration_seconds;
	private String segment_type;
	private Integer human_line_changes;
	private Integer ai_line_changes;
	private String editor;

	// File info
	private int file_id;
	private String file_path;
	private String file_name;
	private String lang;

	// Project info
	private String project_path;
	private String project_name;
	private String project_started_at;

	// User info
	private int user_id;
	private String user_name;
	private String user_email;
	private String user_timezone;

	// Machine info
	private Integer machine_id;
	private String machine_name;
	private String machine_os;

	public EnrichedFileSegment() {
	}

	// Getters and Setters
	public int getSegment_id() {
		return segment_id;
	}

	public void setSegment_id(int segment_id) {
		this.segment_id = segment_id;
	}

	public String getStart_time() {
		return start_time;
	}

	public void setStart_time(String start_time) {
		this.start_time = start_time;
	}

	public String getEnd_time() {
		return end_time;
	}

	public void setEnd_time(String end_time) {
		this.end_time = end_time;
	}

	public Double getDuration_seconds() {
		return duration_seconds;
	}

	public void setDuration_seconds(Double duration_seconds) {
		this.duration_seconds = duration_seconds;
	}

	public String getSegment_type() {
		return segment_type;
	}

	public void setSegment_type(String segment_type) {
		this.segment_type = segment_type;
	}

	public Integer getHuman_line_changes() {
		return human_line_changes;
	}

	public void setHuman_line_changes(Integer human_line_changes) {
		this.human_line_changes = human_line_changes;
	}

	public Integer getAi_line_changes() {
		return ai_line_changes;
	}

	public void setAi_line_changes(Integer ai_line_changes) {
		this.ai_line_changes = ai_line_changes;
	}

	public String getEditor() {
		return editor;
	}

	public void setEditor(String editor) {
		this.editor = editor;
	}

	public int getFile_id() {
		return file_id;
	}

	public void setFile_id(int file_id) {
		this.file_id = file_id;
	}

	public String getFile_path() {
		return file_path;
	}

	public void setFile_path(String file_path) {
		this.file_path = file_path;
	}

	public String getFile_name() {
		return file_name;
	}

	public void setFile_name(String file_name) {
		this.file_name = file_name;
	}

	public String getLang() {
		return lang;
	}

	public void setLang(String lang) {
		this.lang = lang;
	}

	public String getProject_path() {
		return project_path;
	}

	public void setProject_path(String project_path) {
		this.project_path = project_path;
	}

	public String getProject_name() {
		return project_name;
	}

	public void setProject_name(String project_name) {
		this.project_name = project_name;
	}

	public String getProject_started_at() {
		return project_started_at;
	}

	public void setProject_started_at(String project_started_at) {
		this.project_started_at = project_started_at;
	}

	public int getUser_id() {
		return user_id;
	}

	public void setUser_id(int user_id) {
		this.user_id = user_id;
	}

	public String getUser_name() {
		return user_name;
	}

	public void setUser_name(String user_name) {
		this.user_name = user_name;
	}

	public String getUser_email() {
		return user_email;
	}

	public void setUser_email(String user_email) {
		this.user_email = user_email;
	}

	public String getUser_timezone() {
		return user_timezone;
	}

	public void setUser_timezone(String user_timezone) {
		this.user_timezone = user_timezone;
	}

	public Integer getMachine_id() {
		return machine_id;
	}

	public void setMachine_id(Integer machine_id) {
		this.machine_id = machine_id;
	}

	public String getMachine_name() {
		return machine_name;
	}

	public void setMachine_name(String machine_name) {
		this.machine_name = machine_name;
	}

	public String getMachine_os() {
		return machine_os;
	}

	public void setMachine_os(String machine_os) {
		this.machine_os = machine_os;
	}

	@Override
	public String toString() {
		return "EnrichedFileSegment{" + "segment_id=" + segment_id + ", start_time='" + start_time + '\''
				+ ", end_time='" + end_time + '\'' + ", duration_seconds=" + duration_seconds + ", segment_type='"
				+ segment_type + '\'' + ", human_line_changes=" + human_line_changes + ", ai_line_changes="
				+ ai_line_changes + ", editor='" + editor + '\'' + ", file_id=" + file_id + ", file_path='" + file_path
				+ '\'' + ", file_name='" + file_name + '\'' + ", lang='" + lang + '\'' + ", project_path='"
				+ project_path + '\'' + ", project_name='" + project_name + '\'' + ", project_started_at='"
				+ project_started_at + '\'' + ", user_id=" + user_id + ", user_name='" + user_name + '\''
				+ ", user_email='" + user_email + '\'' + ", user_timezone='" + user_timezone + '\'' + ", machine_id="
				+ machine_id + ", machine_name='" + machine_name + '\'' + ", machine_os='" + machine_os + '\'' + '}';
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (!(o instanceof EnrichedFileSegment))
			return false;
		EnrichedFileSegment that = (EnrichedFileSegment) o;
		return segment_id == that.segment_id;
	}

	@Override
	public int hashCode() {
		return Objects.hash(segment_id);
	}
}
