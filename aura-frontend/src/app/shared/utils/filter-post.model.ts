/**
 * filterTable
 * @data Object[]
 * @filter string
 * @spliter number
 */
export function filterTable<T extends Record<string, any>>(
  data: T[],
  filter = '',
  spliter = 0,
  length = 5,
): T[] {
  const Filter = filter.toLocaleLowerCase();
  const Regex = new RegExp(Filter + '[^]*', 'g');
  let filterData: T[] = [];
  data.forEach((el) => {
    for (const k in el) {
      if (Object.prototype.hasOwnProperty.call(el, k)) {
        const element = el[k];
        if (String(element).toLocaleLowerCase().match(Regex)) {
          filterData.push(el);
          break;
        }
      }
    }
  });
  return filterData.slice(spliter, spliter + length);
}
