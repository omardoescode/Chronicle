package sinks;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.flink.connector.jdbc.JdbcExecutionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcStatementBuilder;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.streaming.api.functions.sink.SinkFunction;

import stats.IStat;

public class JdbcSinkFactory {

	public static <T extends IStat> SinkFunction<T> createGeneralSink(final String tableName,
			final String[] primitiveColumns, final String[] jsonbColumns, final String conflictColumns,
			final JdbcConnectionOptions jdbcOptions, final int batchSize, final long batchIntervalMs) {

		final ObjectMapper mapper = new ObjectMapper();

		List<String> allColumns = new ArrayList<>();
		allColumns.addAll(Arrays.asList(primitiveColumns));
		allColumns.addAll(Arrays.asList(jsonbColumns));

		StringBuilder sqlBuilder = new StringBuilder();
		sqlBuilder.append("INSERT INTO ").append(tableName).append(" (").append(String.join(", ", allColumns))
				.append(") VALUES (");

		for (int i = 0; i < allColumns.size(); i++) {
			if (i > 0)
				sqlBuilder.append(", ");
			if (i >= primitiveColumns.length) {
				sqlBuilder.append("?::jsonb");
			} else {
				sqlBuilder.append("?");
			}
		}
		sqlBuilder.append(")");

		if (conflictColumns != null && !conflictColumns.isEmpty()) {
			sqlBuilder.append(" ON CONFLICT (").append(conflictColumns).append(") DO UPDATE SET ");
			boolean first = true;
			for (String col : allColumns) {
				if (!first)
					sqlBuilder.append(", ");
				sqlBuilder.append(col).append(" = EXCLUDED.").append(col);
				first = false;
			}
			sqlBuilder.append(", updated_at = NOW()");
		}
		sqlBuilder.append(";");

		final String sql = sqlBuilder.toString();

		return JdbcSink.sink(sql, new JdbcStatementBuilder<T>() {
			@Override
			public void accept(PreparedStatement ps, T stat) throws SQLException {
				Map<String, Object> record = stat.asRecord();
				int index = 1;
				for (String col : allColumns) {
					Object value = record.get(col);
					try {
						if (value instanceof java.time.Instant) {
							ps.setTimestamp(index++, Timestamp.from((java.time.Instant) value));
						} else if (value instanceof Number || value instanceof String) {
							ps.setObject(index++, value);
						} else {
							ps.setString(index++, mapper.writeValueAsString(value));
						}
					} catch (Exception e) {
						throw new SQLException("Failed to bind column: " + col, e);
					}
				}
			}
		}, JdbcExecutionOptions.builder().withBatchSize(batchSize).withBatchIntervalMs(batchIntervalMs).build(),
				jdbcOptions);
	}
}
