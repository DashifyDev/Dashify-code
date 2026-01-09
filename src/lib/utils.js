// Utility function for merging class names
export function cn(...inputs) {
  const classes = [];
  for (const input of inputs) {
    if (typeof input === 'string' && input) {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(...input.filter(Boolean));
    } else if (typeof input === 'object' && input !== null) {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }
  return classes.join(' ');
}

