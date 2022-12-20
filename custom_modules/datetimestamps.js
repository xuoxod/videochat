export const timeStamp = (date = new Date(), format = "HH:MM:SS") =>
  moment(date).format(format);

export const dateStamp = (date = new Date(), format = "MMMM Do YYYY") =>
  moment(date).format(format);

export const dtStamp = (date = new Date(), format = "MMMM Do YYYY HH:MM:SS") =>
  moment(date).format(format);
