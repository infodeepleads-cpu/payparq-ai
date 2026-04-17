import { redirect } from "next/navigation";

export default function CasesNoticePage({ searchParams }: { searchParams: Record<string, string> }) {
  const qs = new URLSearchParams(searchParams).toString();
  redirect(qs ? `/payments/notice?${qs}` : "/payments/notice");
}
