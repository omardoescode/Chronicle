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
	// Per-user aggregated stats
	private ValueState<UserLanguageStat> userStat;

	// Individual segments for 7-day retention
	private ListState<EnrichedFileSegment> segmentBuffer;

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
		// Load or create user stat
		UserLanguageStat stat = userStat.value();
		if (stat == null)
			stat = new UserLanguageStat(seg.getUser_id());

		// Add new segment to aggregate and buffer
		stat.add(seg);
		segmentBuffer.add(seg);

		// Remove expired segments (and their contributions)
		cleanOldSegments(ctx.timerService().currentProcessingTime(), stat);

		// Update and emit
		userStat.update(stat);
		out.collect(stat);

		// Schedule next hourly emission
		long nextEmit = alignToNextHour(ctx.timerService().currentProcessingTime());
		ctx.timerService().registerProcessingTimeTimer(nextEmit);
	}

	private void cleanOldSegments(long now, UserLanguageStat stat) throws Exception {
		Iterator<EnrichedFileSegment> iter = segmentBuffer.get().iterator();
		long cutoff = now - WINDOW_SIZE_MS;

		while (iter.hasNext()) {
			EnrichedFileSegment s = iter.next();
			long end = Instant.parse(s.getEnd_time()).toEpochMilli();
			if (end < cutoff) {
				stat.remove(s);
				iter.remove();
			}
		}
	}

	private long alignToNextHour(long current) {
		long hours = current / EMIT_INTERVAL_MS;
		return (hours + 1) * EMIT_INTERVAL_MS;
	}

	@Override
	public void onTimer(long timestamp, OnTimerContext ctx, Collector<UserLanguageStat> out) throws Exception {
		UserLanguageStat stat = userStat.value();
		if (stat != null) {
			out.collect(stat);
		}

		long nextEmit = alignToNextHour(timestamp);
		ctx.timerService().registerProcessingTimeTimer(nextEmit);
	}
}
