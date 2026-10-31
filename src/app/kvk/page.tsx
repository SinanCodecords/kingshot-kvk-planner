import type { Metadata } from "next";
import { KvkSignup } from "@/components/tools/kvk/signup";

export const metadata: Metadata = { title: "KvK sign-up" };

export default function KvkSignupPage() {
  return <KvkSignup />;
}
