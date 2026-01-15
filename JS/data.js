export function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

export function diasAtrasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}
