const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./src/models/User");

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.create({
      name: "Super Admin",
      email: "admin@internflow.com",
      password: "Admin@123",
      role: "superAdmin",
    });

    console.log("User created successfully");
    console.log(user);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createUser();