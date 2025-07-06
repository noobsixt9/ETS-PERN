import { pool } from "../database/database.js";
import {
  hashedPassword,
  comparePassword,
  createJwt,
} from "../database/hashedPassword.js";

export const registerUser = async (req, res) => {
  try {
    const { email, firstname, lastname, password, contact } = req.body;

    // server side validations
    if (!firstname || !lastname || !contact || !email || !password) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Please provide all the required fields",
      });
    }
    // check if user already exists or not
    const userExist = await pool.query({
      text: `SELECT EXISTS (SELECT * FROM tbluser WHERE email = $1)`,
      values: [email],
    });

    if (userExist.rows[0].userExist) {
      return res.status(409).json({
        status: "Conflict",
        message: "User already exist with that email. Try logging in",
      });
    }

    const encryptedPassword = await hashedPassword(password);

    const user = await pool.query({
      text: `INSERT INTO tbluser (firstname, lastname, contact, email, password) VALUES($1, $2, $3, $4, $5) RETURNING *`,
      values: [firstname, lastname, contact, email, encryptedPassword],
    });

    user.rows[0].password = undefined;
    res.status(201).json({
      status: "Sucess",
      message: "User Created",
      user: user.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query({
      text: `SELECT * FROM tbluser WHERE email=$1`,
      values: [email],
    });

    const user = result.rows[0];
    if (!user) {
      return res.status(403).json({
        status: "Failed",
        message: "Invalid email or password.",
      });
    }

    const isMatch = await comparePassword(password, user?.password);
    if (!isMatch) {
      return res.status(403).json({
        status: "Failed",
        message: "Invalid email or password.",
      });
    }
    const token = createJwt(user.id);
    user.password = undefined;
    res.status(200).json({
      status: "Sucess",
      message: "Login Sucessful",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};
