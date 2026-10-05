// Monotonic numeric ids: two calls in the same millisecond never collide.
let last = 0;

export const createId = () => {
  const now = Date.now();
  last = now > last ? now : last + 1;
  return last;
};
