import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../Firebase/firebaseConfig";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./button";
import { FcGoogle } from "react-icons/fc";
import api from "../../Firebase/apiCall";
import { toast } from "sonner";
import useStore from "../../store";

export const SocialAuth = ({ isLoading, setLoading }) => {
  const [user] = useAuthState(auth);
  const [selectedProvider, setSelectedProvider] = useState("google");
  const { setCredentials } = useStore((state) => state);

  const navigate = useNavigate();

  const signInWIthGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setSelectedProvider("google");
    try {
      const res = await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google");
    }
  };

  useEffect(() => {
    const saveUserToDb = async () => {
      try {
        const [firstname, ...rest] = user.displayName.split(" ");
        const lastname = rest.join(" ");
        const userData = {
          firstname,
          lastname,
          email: user.email,
          provider: selectedProvider,
          uid: user.uid,
        };
        setLoading(true);
        try {
          const { data: res } = await api.post("/auth/oauth-login", userData);
          if (res?.user) {
            toast.success(res?.message);
            const userInfo = { ...res.user, token: res.token };
            localStorage.setItem("user", JSON.stringify(userInfo));
            setCredentials(userInfo);
            setTimeout(() => {
              navigate("/overview");
            }, 1500);
          }
        } catch (loginerr) {
          if (
            loginerr.response?.status == 403 ||
            loginerr.response?.status == 409
          ) {
            try {
              const { data: res } = await api.post(
                "/auth/oauth-register",
                userData
              );
              if (res?.user) {
                toast.success("Registered successfully");
                const userInfo = { ...res.user, token: res.token };
                localStorage.setItem("user", JSON.stringify(userInfo));
                setCredentials(userInfo);
                setTimeout(() => navigate("/overview"), 1500);
              }
            } catch (registerErr) {
              toast.error(
                registerErr.response?.data?.message || "Registration failed"
              );
            }
          } else {
            toast.error(loginerr.response?.data?.message || "Login failed");
          }
        }
      } catch (error) {
        console.log("Something went wrong: ", error);
        toast.error(error?.response?.data?.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      saveUserToDb();
    }
  }, [user?.uid]);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={signInWIthGoogle}
        disabled={isLoading}
        variant="outline"
        className="w-full text-sm font-normal dark:bg-transparent dark:border-gray-800 dark:text-gray-400 cursor-pointer"
      >
        <FcGoogle className="mr-2 size-5" />
        Continue with Google
      </Button>
    </div>
  );
};
