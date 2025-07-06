import { pool } from "../database/database.js";
import { getMonthName } from "../database/hashedPassword.js";

export const getTransactions = async (req, res) => {
  try {
    const today = new Date();
    const _sevenDaysAgo = new Date(today);
    _sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgo = _sevenDaysAgo.toISOString().split("T")[0];

    const { df, dt, s } = req.query;
    const { userId } = req.user;

    const startDate = new Date(df || sevenDaysAgo);
    const endDate = dt
      ? new Date(new Date(dt).setHours(23, 59, 59, 999))
      : new Date();

    const transactions = await pool.query({
      text: `SELECT * FROM tbltransaction WHERE user_id = $1 AND createdat BETWEEN $2 AND $3 AND (description ILIKE '%' || $4 || '%' OR status ILIKE '%' || $4 || '%' OR source ILIKE '%' || $4 || '%') ORDER BY id DESC`,
      values: [userId, startDate, endDate, s || ""],
    });

    res.status(200).json({
      status: "Success",
      message: "Transactions fetched successfully.",
      data: transactions.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Failed", message: error.message });
  }
};

export const getDashboardInformation = async (req, res) => {
  try {
    const { userId } = req.user;

    const summaryResult = await pool.query({
      text: `SELECT
               SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as totalexpense,
               SUM(CASE WHEN type != 'Expense' THEN amount ELSE 0 END) as totalincome
             FROM tbltransaction
             WHERE user_id = $1`,
      values: [userId],
    });

    const summary = summaryResult.rows[0];
    const totalIncome = Number(summary.totalincome) || 0;
    const totalExpense = Number(summary.totalexpense) || 0;
    const availableBalance = totalIncome - totalExpense;

    const year = new Date().getFullYear();
    const start_Date = `${year}-01-01`;
    const end_Date = `${year}-12-31`;

    const chartResult = await pool.query({
      text: `
        SELECT 
          EXTRACT(MONTH FROM createdat) AS month,
          SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expense,
          SUM(CASE WHEN type != 'Expense' THEN amount ELSE 0 END) as income
        FROM tbltransaction
        WHERE user_id = $1 AND createdat::date BETWEEN $2 AND $3
        GROUP BY EXTRACT(MONTH FROM createdat)
        ORDER BY month
      `,
      values: [userId, start_Date, end_Date],
    });

    const monthlyData = chartResult.rows;
    const data = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = monthlyData.find(
        (item) => Number(item.month) === month
      );
      return {
        label: getMonthName(i),
        income: monthData ? Number(monthData.income) : 0,
        expense: monthData ? Number(monthData.expense) : 0,
      };
    });

    const lastTransactionsResult = await pool.query({
      text: `SELECT * FROM tbltransaction WHERE user_id = $1 ORDER BY id DESC LIMIT 5`,
      values: [userId],
    });

    const lastAccountResult = await pool.query({
      text: `SELECT * FROM tblaccount WHERE user_id = $1 ORDER BY id DESC LIMIT 4`,
      values: [userId],
    });

    res.status(200).json({
      status: "success",
      availableBalance,
      totalIncome,
      totalExpense,
      chartData: data,
      lastTransactions: lastTransactionsResult.rows,
      lastAccount: lastAccountResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "failed", message: error.message });
  }
};

export const addTransactions = async (req, res) => {
  try {
    const { userId } = req.user;
    const { account_id } = req.params;
    const { description, source, amount } = req.body;

    if (!description || !source || !amount) {
      return res.status(400).json({
        status: "Failed",
        message: "Please provide all the required fields.",
      });
    }
    // amount validation for 0 and negative amount
    if (Number(amount) <= 0) {
      return res.status(400).json({
        status: "Failed",
        message: " Can't add negative or 0 amount.",
      });
    }

    // check if the account exist or not
    const result = await pool.query({
      text: `SELECT * FROM tblaccount WHERE id=$1`,
      values: [account_id],
    });

    const accountInfo = result.rows[0];

    if (!accountInfo) {
      return res.status(400).json({
        status: "Failed",
        message: "The account doesn't exist.",
      });
    }
    // check the balance available in the account
    if (
      accountInfo.account_balance <= 0 ||
      accountInfo.account_balance < Number(amount)
    ) {
      return res.status(400).json({
        status: "Failed",
        message: "Transaction failed. Insufficient balance on account.",
      });
    }
    // begin transaction
    await pool.query("BEGIN");
    // deducting the amount first from the account
    await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance - $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [amount, account_id],
    });

    // updating the transaction table
    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, status, source, amount, type) VALUES($1,$2,$3,$4,$5,$6)`,
      values: [userId, description, "Completed", source, amount, "Expense"],
    });

    await pool.query("COMMIT");
    res.status(200).json({
      status: "Success",
      message: "Transaction completed successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};
export const transferMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { from_account, to_account, amount } = req.body;
    // basic validation
    if (!from_account || !to_account || !amount) {
      return res.status(400).json({
        status: "Failed",
        message: "Please provide all the required fields.",
      });
    }

    if (from_account === to_account) {
      return res.status(400).json({
        status: "Failed",
        message: "Cannot transfer money to the same account.",
      });
    }

    // amount checking if 0 or negative
    const newAmount = Number(amount);
    if (newAmount <= 0) {
      return res.status(400).json({
        status: "Failed",
        message: "Can't transfer negative or 0 amount.",
      });
    }

    await pool.query("BEGIN");

    // check account details and balance for the from_account
    const fromAccountResult = await pool.query({
      text: `SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2`,
      values: [from_account, userId],
    });

    const fromAccount = fromAccountResult.rows[0];
    if (!fromAccount) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "Failed",
        message: "Sender account not found.",
      });
    }

    // check account details for the to_account
    const toAccountResult = await pool.query({
      text: `SELECT * FROM tblaccount WHERE id = $1`,
      values: [to_account],
    });

    const toAccountInfo = toAccountResult.rows[0];
    if (!toAccountInfo) {
      await pool.query("ROLLBACK");
      return res.status(404).json({
        status: "Failed",
        message: "Recipient account not found.",
      });
    }

    if (newAmount > fromAccount.account_balance) {
      await pool.query("ROLLBACK");
      return res.status(400).json({
        status: "Failed",
        message: "Transfer failed. Insufficient balance on account.",
      });
    }

    // deduct from from_account
    await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance - $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [newAmount, from_account],
    });

    // add to to_account
    await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance + $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [newAmount, to_account],
    });

    // create transaction record for from_account as expense
    const description = `Transfer from ${fromAccount.account_name} to ${toAccountInfo.account_name}`;
    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, status, source, amount, type) VALUES($1,$2,$3,$4,$5,$6)`,
      values: [
        userId,
        description,
        "Completed",
        fromAccount.account_name,
        newAmount,
        "Expense",
      ],
    });

    // create transaction record for to_account as income
    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, status, source, amount, type) VALUES($1,$2,$3,$4,$5,$6)`,
      values: [
        userId,
        description,
        "Completed",
        toAccountInfo.account_name,
        newAmount,
        "Income",
      ],
    });

    await pool.query("COMMIT");

    res.status(200).json({
      status: "Success",
      message: "Money transferred successfully.",
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
