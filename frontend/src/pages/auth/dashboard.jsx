import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { saveAs } from "file-saver";

const Button = ({ children, className = "", onClick }) => (
  <button
    onClick={onClick}
    className={`bg-white text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-100 ${className}`.trim()}
  >
    {children}
  </button>
);

const Card = ({ children, className }) => (
  <div className={`rounded-xl bg-gray-800 text-white shadow p-4 ${className}`}>{children}</div>
);

const CardContent = ({ children }) => (
  <div className="p-2">{children}</div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [theme, setTheme] = useState("dark");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    document.body.className = theme === "dark" ? "bg-gray-900" : "bg-white";
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard");
        const data = await res.json();
        setSummary(data.summary);
        setRecentTransactions(data.recentTransactions);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };
    fetchData();
  }, []);

  const pieData = [
    { name: "Income", value: summary?.income || 0 },
    { name: "Expenses", value: summary?.expenses || 0 },
  ];
  const COLORS = ["#34d399", "#f87171"];

  const exportCSV = () => {
    const csvContent = [
      ["Description", "Amount", "Type"],
      ...recentTransactions.map(tx => [tx.description, tx.amount, tx.type])
    ]
      .map(row => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "transactions.csv");
  };

  const filteredTransactions = filter === "all"
    ? recentTransactions
    : recentTransactions.filter(tx => tx.type === filter);

  return (
    <div className="p-6 space-y-6 min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expense Dashboard</h1>
        <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "Light" : "Dark"} Mode</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent><h2 className="text-lg font-semibold">Total Income</h2><p className="text-2xl">Rs. {summary?.income || 0}</p></CardContent></Card>
        <Card><CardContent><h2 className="text-lg font-semibold">Total Expenses</h2><p className="text-2xl">Rs. {summary?.expenses || 0}</p></CardContent></Card>
        <Card><CardContent><h2 className="text-lg font-semibold">Net Balance</h2><p className="text-2xl">Rs. {summary?.balance || 0}</p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Monthly Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.monthly || []}>
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="amount" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Income vs. Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter & Export */}
      <div className="flex justify-between items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Transactions */}
      <div className="bg-gray-800 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Button className="text-sm">View All</Button>
        </div>
        <ul className="divide-y divide-gray-700">
          {filteredTransactions.length === 0 && <li className="text-gray-400">No transactions found.</li>}
          {filteredTransactions.map((tx, index) => (
            <li key={index} className="py-2 flex justify-between">
              <span>{tx.description}</span>
              <span className={tx.type === "income" ? "text-green-400" : "text-red-400"}>
                {tx.type === "income" ? "+" : "-"}Rs. {tx.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
