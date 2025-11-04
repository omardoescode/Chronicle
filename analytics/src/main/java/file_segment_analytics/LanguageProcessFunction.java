package file_segment_analytics;

import models.EnrichedFileSegment;
import org.apache.flink.api.common.state.*;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class LanguageProcessFunction extends KeyedProcessFunction<Integer, EnrichedFileSegment, UserLanguageStat> {

	private ValueState<UserLanguageStat> userStat;
	private ListState<EnrichedFileSegment> segmentBuffer;

	private final long windowSizeMs;
	private final long emitIntervalMs;

	public LanguageProcessFunction(long windowSizeMs, long emitIntervalMs) {
		this.windowSizeMs = windowSizeMs;
		this.emitIntervalMs = emitIntervalMs;
	}

	@Override
	public void open(Configuration parameters) {
		userStat = getRuntimeContext().getState(new ValueStateDescriptor<>("userStat", UserLanguageStat.class));

		segmentBuffer = getRuntimeContext()
				.getListState(new ListStateDescriptor<>("segmentBuffer", EnrichedFileSegment.class));
	}

	@Override
	public void processElement(EnrichedFileSegment seg, Context ctx, Collector<UserLanguageStat> out) throws Exception {
		UserLanguageStat stat = userStat.value();
		if (stat == null)
			stat = new UserLanguageStat(seg.getUser_id());

		// Load all current segments
		List<EnrichedFileSegment> segments = new ArrayList<>();
		for (EnrichedFileSegment s : segmentBuffer.get()) {
			segments.add(s);
		}

		// Add new segment
		segments.add(seg);
		stat.add(seg);

		// Clean expired
		cleanOldSegments(segments, stat, ctx.timerService().currentProcessingTime());

		// Update state
		segmentBuffer.update(segments);
		userStat.update(stat);

		// Emit immediately (you can remove this if you want only periodic emission)
		out.collect(stat);

		// Schedule next emit
		long nextEmit = alignToNextInterval(ctx.timerService().currentProcessingTime());
		ctx.timerService().registerProcessingTimeTimer(nextEmit);
	}

	private void cleanOldSegments(List<EnrichedFileSegment> segments, UserLanguageStat stat, long now) {
		long cutoff = now - windowSizeMs;
		List<EnrichedFileSegment> updated = new ArrayList<>();

		for (EnrichedFileSegment s : segments) {
			long end = Instant.parse(s.getEnd_time()).toEpochMilli();
			if (end >= cutoff) {
				updated.add(s);
			} else {
				stat.remove(s);
			}
		}

		segments.clear();
		segments.addAll(updated);
	}

	private long alignToNextInterval(long current) {
		long intervals = current / emitIntervalMs;
		return (intervals + 1) * emitIntervalMs;
	}

	@Override
	public void onTimer(long timestamp, OnTimerContext ctx, Collector<UserLanguageStat> out) throws Exception {
		UserLanguageStat stat = userStat.value();
		Iterable<EnrichedFileSegment> segmentsIterable = segmentBuffer.get();

		boolean hasSegments = segmentsIterable.iterator().hasNext();

		if (stat != null && hasSegments) {
			out.collect(stat);
		} else {
			userStat.clear();
			segmentBuffer.clear();
		}

		// Register next timer
		long nextEmit = alignToNextInterval(timestamp);
		ctx.timerService().registerProcessingTimeTimer(nextEmit);
	}
}
