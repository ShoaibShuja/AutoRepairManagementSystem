import { LoadingSkeleton } from "@/components/operational/display";
export default function AppLoading() { return <div className="space-y-6"><LoadingSkeleton className="h-8 w-56"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <LoadingSkeleton className="h-28" key={index}/>)}</div><LoadingSkeleton className="h-64"/></div>; }
