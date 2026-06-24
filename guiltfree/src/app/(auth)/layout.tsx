import { GuestGuard } from "@/components/auth/guest-guard";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <GuestGuard>{children}</GuestGuard>;
}
