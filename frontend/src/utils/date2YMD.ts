export default function date2DMY(date: Date) {
  const dd = date.getDate().toString().padStart(2, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = date.getFullYear().toString().padStart(4, "0");
  return `${yyyy}${mm}${dd}`;
}
