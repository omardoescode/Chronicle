package stats;

import java.time.Instant;

public final class WindowContext {
  private final Instant windowStart;
  private final Instant windowEnd;

  public WindowContext(Instant windowStart, Instant windowEnd) {
    this.windowStart = windowStart;
    this.windowEnd = windowEnd;
  }

  public Instant getWindowStart() {
    return windowStart;
  }

  public Instant getWindowEnd() {
    return windowEnd;
  }
}
