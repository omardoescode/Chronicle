export function makePlaceholderGenerator(cols: number) {
  let index = 0;

  return () => {
    const placeholders = Array.from(
      { length: cols },
      (_, i) => `$${index + i + 1}`
    ).join(", ");
    index += cols;
    return `(${placeholders})`;
  };
}
