"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMagicLinkAction } from "@/lib/actions/students";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function StudentReturnVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Missing link.");
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await verifyMagicLinkAction(token);
      if (cancelled) return;
      if (result.ok && result.studentId && result.classId) {
        localStorage.setItem("gorillamaths.studentId", result.studentId);
        localStorage.setItem("gorillamaths.classId", result.classId);
        localStorage.setItem("gorillamaths.loginAt", Date.now().toString());
        setStatus("ok");
        router.replace("/play");
      } else {
        setStatus("error");
        setError(result.error ?? "Invalid or expired link.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">
            Link invalid or expired
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/student/return")}
          >
            Back to return
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
      <Card>
        <p className="text-slate-600">
          {status === "pending" ? "Signing you in…" : "Redirecting…"}
        </p>
      </Card>
    </main>
  );
}

export default function StudentReturnVerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-12">
          <Card>
            <p className="text-slate-600">Loading…</p>
          </Card>
        </main>
      }
    >
      <StudentReturnVerifyContent />
    </Suspense>
  );
}
