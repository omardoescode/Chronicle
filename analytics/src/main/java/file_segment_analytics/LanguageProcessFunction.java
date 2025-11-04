package file_segment_analytics;

import models.EnrichedFileSegment;
import org.apache.flink.api.common.state.*;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;

public class LanguageProcessFunction extends KeyedProcessFunction<Integer, EnrichedFileSegment, UserLanguageStat> {
	// Keep per-user aggregated stats
	private ValueState<UserLanguageStat> userStat;

	// Keep individual event timestamps to drop old ones (simple retention)
	private ListState<EnrichedFileSegment> segmentBuffer;

	// Define constants
	private static final long WINDOW_SIZE_MS = Duration.ofDays(7).toMillis();
	private static final long EMIT_INTERVAL_MS = Duration.ofHours(1).toMillis();

	@Override
	public void open(Configuration parameters) {
		ValueStateDescriptor<UserLanguageStat> userStatDesc = new ValueStateDescriptor<>("userStat",
				UserLanguageStat.class);
		userStat = getRuntimeContext().getState(userStatDesc);

		ListStateDescriptor<EnrichedFileSegment> segmentDesc = new ListStateDescriptor<>("segmentBuffer",
				EnrichedFileSegment.class);
		segmentBuffer = getRuntimeContext().getListState(segmentDesc);
	}

	@Override
	public void processElement(EnrichedFileSegment seg, Context ctx, Collector<UserLanguageStat> out) throws Exception {
		// Get or create user's stat
		UserLanguageStat stat = userStat.value();
		if (stat == null)
			stat = new UserLanguageStat(seg.getUser_id());

		// Add new segment to buffer
		segmentBuffer.add(seg);

		// Remove old events (older than 7 days)
		cleanOldSegments(ctx.timestamp());

		// Recalculate from remaining segments
		UserLanguageStat newStat = rebuildStatFromBuffer();

		// Save and emit
		userStat.update(newStat);
		out.collect(newStat);

		// Register timer for next hourly emission
		long nextEmit = alignToNextHour(ctx.timerService().currentProcessingTime());
		ctx.timerService().registerProcessingTimeTimer(nextEmit);
	}

	private void cleanOldSegments(long now) throws Exception {
		Iterator<EnrichedFileSegment> iter = segmentBuffer.get().iterator();
		long cutoff = now - WINDOW_SIZE_MS;
		while (iter.hasNext()) {
			EnrichedFileSegment s = iter.next();
			long end = Instant.parse(s.getEnd_time()).toEpochMilli();
			if (end < cutoff)
				iter.remove();
		}
	}

	private UserLanguageStat rebuildStatFromBuffer() throws Exception {
		Iterator<EnrichedFileSegment> iter = segmentBuffer.get().iterator();
		UserLanguageStat newStat = null;
		while (iter.hasNext()) {
			EnrichedFileSegment seg = iter.next();
			if (newStat == null)
				newStat = new UserLanguageStat(seg.getUser_id());
			newStat.add(seg);
		}
		return newStat;
	}

	private long alignToNextHour(long current) {
		long hours = current / EMIT_INTERVAL_MS;
		return (hours + 1) * EMIT_INTERVAL_MS;
	}

	@Override
	public void onTimer(long timestamp, OnTimerContext ctx, Collector<UserLanguageStat> out) throws Exception {
		// Emit snapshot every hour
		UserLanguageStat stat = userStat.value();
		if (stat != null) {
			out.collect(stat);
		}

		// Register next timer
		long nextEmit = alignToNextHour(timestamp);
		ctx.timerService().registerProcessingTimeTimer(nextEmit);
	}
}
