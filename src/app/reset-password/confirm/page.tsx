import { Suspense } from "react";
import { ConfirmResetForm } from "./confirm-reset-form";

export default function ConfirmResetPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <ConfirmResetForm />
      </Suspense>
    </div>
  );
}
