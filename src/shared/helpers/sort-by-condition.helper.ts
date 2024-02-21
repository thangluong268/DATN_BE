import removeVietnameseTones from './remove-vietnamese-tones.helper';

function sortByConditions(
  entire: any,
  sortTypeQuery: string,
  sortValueQuery: string,
) {
  sortTypeQuery === 'asc' &&
    entire.sort((a: any, b: any) => {
      if (
        removeVietnameseTones(a[`${sortValueQuery}`].toString()).toUpperCase() >
        removeVietnameseTones(b[`${sortValueQuery}`].toString()).toUpperCase()
      )
        return -1;
      if (
        removeVietnameseTones(a[`${sortValueQuery}`].toString()).toUpperCase() <
        removeVietnameseTones(b[`${sortValueQuery}`].toString()).toUpperCase()
      )
        return 1;
      return 0;
    });
  sortTypeQuery === 'desc' &&
    entire.sort((a: any, b: any) => {
      if (
        removeVietnameseTones(a[`${sortValueQuery}`].toString()).toUpperCase() <
        removeVietnameseTones(b[`${sortValueQuery}`].toString()).toUpperCase()
      )
        return -1;
      if (
        removeVietnameseTones(a[`${sortValueQuery}`].toString()).toUpperCase() >
        removeVietnameseTones(b[`${sortValueQuery}`].toString()).toUpperCase()
      )
        return 1;
      return 0;
    });
}

export default sortByConditions;
