import "@/utils/db"; // Initialize MongoDB connection
import User from "@/models/user";

const getUser = async (req, res) => {
  try {
    const { email, name, picture, sub } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const setFields = {
      name: name || email.split("@")[0],
      auth0Id: sub,
    };
    if (picture != null) setFields.picture = picture;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: setFields,
        $setOnInsert: {
          email,
          createdAt: new Date(),
          isSocialLogin: true,
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

export default getUser;
