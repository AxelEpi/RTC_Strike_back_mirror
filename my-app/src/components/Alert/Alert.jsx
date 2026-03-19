export default function Alert({ message, type }) {
  if (!message) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div id="alert" className={`mb-4 p-3 rounded text-center text-white ${bgColor}`}>
      {message}
    </div>
  );
}
