import { pool } from "../database/database.js";
import { comparePassword, hashedPassword } from "../database/hashedPassword.js";

export const getUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const userExist = await pool.query({
      text: `SELECT * FROM tbluser WHERE id = $1`,
      values: [userId],
    });

    const user = userExist.rows[0];
    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "User not found",
      });
    }

    delete user.password;

    return res.status(200).json({
      status: "Success",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

export const changePasssword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !currentPassword || !confirmPassword) {
      return res.status(400).json({
        status: "Failed",
        message: "Please provide all required fields.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "Failed",
        message: "Password doesn't match.",
      });
    }

    const userExist = await pool.query({
      text: `SELECT * FROM tbluser WHERE id = $1`,
      values: [userId],
    });

    const user = userExist.rows[0];
    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "User not found",
      });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "Failed",
        message: "Invalid current password.",
      });
    }

    const encryptedPassword = await hashedPassword(newPassword);
    await pool.query({
      text: `UPDATE tbluser SET password = $1 WHERE id = $2`,
      values: [encryptedPassword, userId],
    });

    res.status(200).json({
      status: "Success",
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { firstname, lastname, country, contact } = req.body;

    const userExist = await pool.query({
      text: `SELECT * FROM tbluser WHERE id = $1`,
      values: [userId],
    });

    const user = userExist.rows[0];
    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "User not found",
      });
    }

    const updatedUserQuery = await pool.query({
      text: `UPDATE tbluser SET firstname = $1, lastname = $2, country = $3, contact = $4, updatedat = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`,
      values: [firstname, lastname, country, contact, userId],
    });

    const updatedUser = updatedUserQuery.rows[0];
    delete updatedUser.password;

    res.status(200).json({
      status: "Success",
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};
