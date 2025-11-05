package file_segment_analytics;

import models.EnrichedFileSegment;
import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.time.Instant;

public class UserStatWindowFunction
		extends ProcessWindowFunction<EnrichedFileSegment, UserAggregateStat, Integer, TimeWindow> {

	private final String windowType;

	public UserStatWindowFunction(String windowType) {
		this.windowType = windowType;
	}

	@Override
	public void process(Integer userId, Context ctx, Iterable<EnrichedFileSegment> segments,
			Collector<UserAggregateStat> out) {
		UserAggregateStat stat = new UserAggregateStat(userId);
		for (EnrichedFileSegment seg : segments) {
			stat.add(seg);
		}

		stat.setWindowType(windowType);
		stat.setWindowStart(Instant.ofEpochMilli(ctx.window().getStart()));
		stat.setWindowEnd(Instant.ofEpochMilli(ctx.window().getEnd()));

		out.collect(stat);
	}
}
