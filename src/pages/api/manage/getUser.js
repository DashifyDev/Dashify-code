import "@/utils/db"; // Initialize MongoDB connection
import User from "@/models/user";

const getUser = async (req, res) => {
  try {

    const { email, name, picture, sub } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      const newUser = new User({
        email: email,
        name: name || email.split("@")[0],
        picture: picture,
        auth0Id: sub,
      });

      user = await newUser.save();
      console.log("New user created:", user.email);
    }

    if (user) {
      res.status(200).json(user);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export default getUser;
