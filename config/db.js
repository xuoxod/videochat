import chalk from "chalk";

const connectDB = async (mongoose) => {
  console.log(`\n\tConnecting to DB`);
  try {
    const conn = await mongoose.connect(process.env.DB_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      // useFindAndModify: false,
      // useCreateIndex: true,
    });
    /* console.log(
      chalk.rgb(185, 220, 250).bold(`\tDB Connected: ${conn.connection.host}`)
    ); */
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
