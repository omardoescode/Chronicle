package file_segment_analytics;

import models.EnrichedFileSegment;
import stats.IStat;
import stats.StatFactory;
import stats.WindowContext;

import org.apache.flink.streaming.api.functions.windowing.ProcessWindowFunction;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;
import java.time.Instant;

public class UserStatWindowFunction<K, S extends IStat>
		extends ProcessWindowFunction<EnrichedFileSegment, S, K, TimeWindow> {

	private final String windowType;
	private final StatFactory<K, S> stat_factory;

	public UserStatWindowFunction(String windowType, StatFactory<K, S> factory) {
		this.windowType = windowType;
		this.stat_factory = factory;
	}

	@Override
	public void process(K key, Context ctx, Iterable<EnrichedFileSegment> segments, Collector<S> out) {
		S stat = stat_factory.create(key);
		for (EnrichedFileSegment seg : segments) {
			stat.add(seg);
		}

		WindowContext windowContext = new WindowContext(windowType, Instant.ofEpochMilli(ctx.window().getStart()),
				Instant.ofEpochMilli(ctx.window().getEnd()));

		stat.postProcess(windowContext);

		out.collect(stat);
	}
}
