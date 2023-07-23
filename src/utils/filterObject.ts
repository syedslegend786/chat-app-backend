export const filterObject = (
  data: { [key: string]: string },
  allowedFields: string[]
): { [key: string]: string } => {
  return Object.keys(data).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      acc[key] = data[key];
    }
    return acc;
  }, {});
};
