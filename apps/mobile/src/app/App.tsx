import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#111D32",
            border: "1px solid rgba(203,213,225,0.08)",
            color: "#F8FAFC",
            fontSize: "13px",
            fontFamily: "'Noto Sans JP', sans-serif",
          },
        }}
        gap={8}
        visibleToasts={3}
      />
    </>
  );
}
