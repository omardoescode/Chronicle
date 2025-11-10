package file_segment_analytics;

import models.EnrichedFileSegment;

public interface IStat {
	void add(EnrichedFileSegment seg);

	void postProcess(WindowContext ctx);
}
