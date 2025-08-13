import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ActivateAccount() {
  const { vuId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const activate = async () => {
      try {
        // Backend ka full URL use karo
        const res = await axios.get(`http://localhost:3000/api/users/activate/${vuId}`);
        setMessage(res.data.message || `Account ${vuId} activated successfully!`);
        setLoading(false);
  
        // 2 sec baad login page par redirect
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error: any) {
        setMessage(
          error.response?.data?.message || "Account activation failed."
        );
        setLoading(false);
      }
    };
  
    activate();
  }, [vuId, navigate]);
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg animate-pulse">Activating account, please wait...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4">
      <h2 className="text-2xl font-semibold mb-4 text-green-600">
        {message}
      </h2>
    </div>
  );
}
