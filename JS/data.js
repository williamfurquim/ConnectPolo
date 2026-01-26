export function hojeISO() {
  return new Date().toLocaleDateString("en-CA");
}

export function diasAtrasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toLocaleDateString("en-CA");
}
