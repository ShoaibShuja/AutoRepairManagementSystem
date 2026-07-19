"use client";
import { ErrorState } from "@/components/operational/display";
export default function AppError({ reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) { return <ErrorState retry={reset}/>; }
