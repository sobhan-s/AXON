import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  progress,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
  progress?: number;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <div className={`rounded-md p-1.5 ${iconClass ?? 'bg-muted/60'}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-1" />
        )}
      </CardContent>
    </Card>
  );
}