package file_segment_analytics;

import java.time.Instant;

public final class WindowContext {
	private final String windowType;
	private final Instant windowStart;
	private final Instant windowEnd;

	public WindowContext(String windowType, Instant windowStart, Instant windowEnd) {
		this.windowType = windowType;
		this.windowStart = windowStart;
		this.windowEnd = windowEnd;
	}

	public String getWindowType() {
		return windowType;
	}

	public Instant getWindowStart() {
		return windowStart;
	}

	public Instant getWindowEnd() {
		return windowEnd;
	}
}
