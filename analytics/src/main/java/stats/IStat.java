package stats;

import java.util.Map;

import models.EnrichedFileSegment;

public interface IStat {
	void add(EnrichedFileSegment seg);

	void postProcess(WindowContext ctx);

	Map<String, Object> asRecord();
}
