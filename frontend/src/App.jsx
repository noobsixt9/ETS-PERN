import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AccountPage from "./pages/auth/account-page";
import Dashboard from "./pages/auth/dashboard";
import Settings from "./pages/auth/settings";
import SignIn from "./pages/auth/sign-in";
import SignUp from "./pages/auth/sign-up";
import Transactions from "./pages/auth/transactions";

const RootLayout = () => {
  const user = null;

  return !user ? (
    <Navigate to="sign-in" />
  ) : (
    <>
      <div>
        <Outlet />
      </div>
    </>
  );
};
function App() {
  return (
    <main>
      <div>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Navigate to="/overview" />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/setting" element={<Settings />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </div>
    </main>
  );
}

export default App;
