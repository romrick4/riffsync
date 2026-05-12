import { Suspense } from "react";
import { VerifyForm } from "./verify-form";

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
