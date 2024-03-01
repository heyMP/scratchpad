function containsAllValues(arr: number[]): boolean {
  const answer = Array.from({ length: arr.length }, (_: any, i: number) => i).join('');
  const values = arr.sort().join('');
  return answer === values;
}

clear();
log(containsAllValues([1, 2, 0, 3]) === true);
log(containsAllValues([0, 1, 2, 2, 3]) === false);
log(containsAllValues([0]) === true);
