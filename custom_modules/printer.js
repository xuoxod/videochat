export const log = console.log.bind(console);

export const table = console.table.bind(console);

export const error = console.error.bind(console);

export const cls = console.clear.bind(console);

export const dlog = (argument = "", label = "") => {
  console.group(label);
  console.log(argument);
  console.groupEnd();
};

export const tlog = (arg = "", label = "") => {
  console.group(label);
  console.trace(`${arg}`);
  console.groupEnd();
};
