package stats;

@FunctionalInterface
public interface StatFactory<K, T extends IStat> {
	T create(K key);
}
