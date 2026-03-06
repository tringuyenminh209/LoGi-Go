import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { WsProvider } from "./context/WsContext";

export default function App() {
  return (
    <AuthProvider>
      <WsProvider>
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
      </WsProvider>
    </AuthProvider>
  );
}
