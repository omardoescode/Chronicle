package models;

import java.io.Serializable;
import java.util.Objects;

public class FileSegment implements Serializable {
	private static final long serialVersionUID = 1L;

	private Integer segment_id;
	private Integer file_id;
	private Long start_time;
	private Long end_time;
	private String segment_type;
	private Integer human_line_changes;
	private Integer ai_line_changes;
	private String editor;
	private Integer machine_id;

	// Default constructor (required by Flink)
	public FileSegment() {
	}

	// All-args constructor
	public FileSegment(Integer segment_id, Integer file_id, Long start_time, Long end_time, String segment_type,
			Integer human_line_changes, Integer ai_line_changes, String editor, Integer machine_id) {
		this.segment_id = segment_id;
		this.file_id = file_id;
		this.start_time = start_time;
		this.end_time = end_time;
		this.segment_type = segment_type;
		this.human_line_changes = human_line_changes;
		this.ai_line_changes = ai_line_changes;
		this.editor = editor;
		this.machine_id = machine_id;
	}

	// Getters
	public Integer getSegment_id() {
		return segment_id;
	}

	public Integer getFile_id() {
		return file_id;
	}

	public Long getStart_time() {
		return start_time;
	}

	public Long getEnd_time() {
		return end_time;
	}

	public String getSegment_type() {
		return segment_type;
	}

	public Integer getHuman_line_changes() {
		return human_line_changes;
	}

	public Integer getAi_line_changes() {
		return ai_line_changes;
	}

	public String getEditor() {
		return editor;
	}

	public Integer getMachine_id() {
		return machine_id;
	}

	// Setters
	public void setSegment_id(Integer segment_id) {
		this.segment_id = segment_id;
	}

	public void setFile_id(Integer file_id) {
		this.file_id = file_id;
	}

	public void setStart_time(Long start_time) {
		this.start_time = start_time;
	}

	public void setEnd_time(Long end_time) {
		this.end_time = end_time;
	}

	public void setSegment_type(String segment_type) {
		this.segment_type = segment_type;
	}

	public void setHuman_line_changes(Integer human_line_changes) {
		this.human_line_changes = human_line_changes;
	}

	public void setAi_line_changes(Integer ai_line_changes) {
		this.ai_line_changes = ai_line_changes;
	}

	public void setEditor(String editor) {
		this.editor = editor;
	}

	public void setMachine_id(Integer machine_id) {
		this.machine_id = machine_id;
	}

	// equals and hashCode
	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		FileSegment that = (FileSegment) o;
		return Objects.equals(segment_id, that.segment_id) && Objects.equals(file_id, that.file_id)
				&& Objects.equals(start_time, that.start_time) && Objects.equals(end_time, that.end_time)
				&& Objects.equals(segment_type, that.segment_type)
				&& Objects.equals(human_line_changes, that.human_line_changes)
				&& Objects.equals(ai_line_changes, that.ai_line_changes) && Objects.equals(editor, that.editor)
				&& Objects.equals(machine_id, that.machine_id);
	}

	@Override
	public int hashCode() {
		return Objects.hash(segment_id, file_id, start_time, end_time, segment_type, human_line_changes,
				ai_line_changes, editor, machine_id);
	}

	// toString
	@Override
	public String toString() {
		return "FileSegment{" + "segment_id=" + segment_id + ", file_id=" + file_id + ", start_time=" + start_time
				+ ", end_time=" + end_time + ", segment_type='" + segment_type + '\'' + ", human_line_changes="
				+ human_line_changes + ", ai_line_changes=" + ai_line_changes + ", editor='" + editor + '\''
				+ ", machine_id=" + machine_id + '}';
	}
}
