package file_segment_analytics;

@FunctionalInterface
interface StatFactory<K, T extends IStat> {
	T create(K key);
}
