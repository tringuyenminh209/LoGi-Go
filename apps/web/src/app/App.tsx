import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AuthProvider } from "./components/auth-context";
import { NotificationProvider } from "./components/notification-context";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111D32",
              border: "1px solid rgba(203,213,225,0.08)",
              color: "#F8FAFC",
              fontSize: "13px",
              fontFamily: "'Noto Sans JP', sans-serif",
              padding: 0,
            },
            unstyled: true,
          }}
          gap={8}
          visibleToasts={4}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}