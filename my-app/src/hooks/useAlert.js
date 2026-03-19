import { useState } from "react";

export function useAlert() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("success"); // "success" ou "error"

  const showSuccess = (msg) => {
    setMessage(msg);
    setType("success");
  };

  const showError = (msg) => {
    setMessage(msg);
    setType("error");
  };

  const clear = () => {
    setMessage("");
  };

  return { message, type, showSuccess, showError, clear };
}
