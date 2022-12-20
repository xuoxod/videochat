import colors from "colors";
import chalk from "chalk";
import { log } from "./printer.js";

colors.enable();

export const errorMessage = (arg = "") => `${arg}`.brightRed;

export const successMessage = (arg = "") => `${arg}`.brightGreen;

export const warningMessage = (arg = "") => `${arg}`.brightYellow;

export const infoMessage = (arg = "") => `${arg}`.grey.bgWhite;

export const fyiMessage = (arg = "") => `${arg}`.brightWhite;

export const dbMessage = (arg = "") => chalk.rgb(185, 220, 250).bold(`${arg}`);

export const successStatus = (arg = "") => `${arg}`.brightWhite.bgGreen;

export const warningStatus = (arg = "") => chalk.rgb(55, 55, 95).bold(`${arg}`);

export const errorStatus = (arg = "") => `${arg}`.brightWhite.brightRed;
