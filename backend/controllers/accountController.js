import { text } from "express";
import { pool } from "../database/database.js";

export const getAccounts = async (req, res) => {
  try {
    const { userId } = req.user;
    const accounts = await pool.query({
      text: `SELECT * FROM tblaccount WHERE user_id = $1`,
      values: [userId],
    });

    res.status(200).json({
      staus: "Success",
      message: "Accounts fetched successfully",
      data: accounts.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, amount, account_number } = req.body;

    if (!name || !amount || !account_number) {
      return res.status(400).json({
        status: "Failed",
        message: "Please provide all the required fileds",
      });
    }

    await pool.query("BEGIN");

    const accountExistQuery = {
      text: `SELECT * FROM tblaccount WHERE account_name = $1 AND user_id = $2`,
      values: [name, userId],
    };

    const accountExistResult = await pool.query(accountExistQuery);
    const accountExist = accountExistResult.rows[0];

    if (accountExist) {
      await pool.query("ROLLBACK");
      return res.status(409).json({
        status: "Failed",
        message: "Account already exist.",
      });
    }
    const createAccountResult = await pool.query({
      text: `INSERT INTO tblaccount(user_id, account_name, account_number, account_balance ) VALUES ($1, $2, $3, $4) RETURNING *`,
      values: [userId, name, account_number, amount],
    });
    const account = createAccountResult.rows[0];
    // checking if name is an arrya if it is return as it is else make it an array of single value
    const userAccounts = Array.isArray(name) ? name : [name];
    const updateUserAccountQuery = {
      text: `UPDATE tbluser SET accounts = array_cat(accounts, $1), updatedat= CURRENT_TIMESTAMP WHERE id = $2`,
      values: [userAccounts, userId],
    };

    await pool.query(updateUserAccountQuery);

    // add initial deposit transaction

    const description = account.account_name + "(Initial Deposit)";

    const initialDepositQuery = {
      text: `INSERT INTO tbltransaction(user_id, description, status, source, amount, type) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      values: [
        userId,
        description,
        "Completed",
        account.account_name,
        amount,
        "Income",
      ],
    };

    await pool.query(initialDepositQuery);

    await pool.query("COMMIT");

    res.status(201).json({
      status: "Success",
      message: account.account_name + "account created successfully",
      data: account,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};

export const addMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { amount } = req.body;
    const newAmount = Number(amount);

    await pool.query("BEGIN");

    const result = await pool.query({
      text: `UPDATE tblaccount SET account_balance = (account_balance + $1), updatedat = CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      values: [newAmount, id],
    });

    const accountInformation = result.rows[0];
    const description = accountInformation.account_name + "(deposit)";

    const transQuery = {
      text: `INSERT INTO tbltransaction(user_id, description, status, source, amount, type) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      values: [
        userId,
        description,
        "Completed",
        accountInformation.account_name,
        newAmount,
        "Income",
      ],
    };

    await pool.query(transQuery);

    await pool.query("COMMIT");

    res.status(200).json({
      status: "Success",
      message: "Funds added successfully",
      data: accountInformation,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};
