"use client";

import { QRCodeCanvas } from "qrcode.react";

type JoinCodeQrProps = {
  joinCode: string;
};

export function JoinCodeQr({ joinCode }: JoinCodeQrProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const value =
    baseUrl != null && baseUrl !== ""
      ? `${baseUrl.replace(/\/$/, "")}/join?code=${encodeURIComponent(joinCode)}`
      : joinCode;

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeCanvas value={value} size={160} />
      <span className="text-sm text-slate-500">Scan to join</span>
    </div>
  );
}
