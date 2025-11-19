import connectMongo from "@/utils/db";
import User from "@/models/user";
import Dashboard from "@/models/dashboard";

export default async function addUser(req, res) {
  try {
    await connectMongo();
    console.log("database Connected Successfully");
    switch (req.method) {
      case "POST":
        const {
          firstName,
          lastName,
          email,
          createdAt,
          picture,
          email_verified,
        } = req.body;

        let user = await User.findOne({ email });
        if (user)
          return res.status(200).json({ message: "User already exists" });

        user = new User({
          firstName,
          lastName,
          email,
          picture,
          createdAt,
          isSocialLogin: email_verified,
        });
        await user.save();
        res.status(201).json({
          user,
          message: "user register succesfully",
        });

        break;

      default:
        break;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}
