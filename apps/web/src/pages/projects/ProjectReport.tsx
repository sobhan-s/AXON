import { Separator as Sep2 } from '@/components/ui/separator';
import { BarChart2, Clock, CheckSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ProjectReportsPage() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Project analytics and time tracking.
        </p>
      </div>
      <Sep2 />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: CheckSquare,
            label: 'Tasks Completed',
            value: '. . .',
            color: 'text-emerald-600 bg-emerald-100',
          },
          {
            icon: Clock,
            label: 'Total Hours',
            value: '. . .',
            color: 'text-blue-600 bg-blue-100',
          },
          {
            icon: AlertCircle,
            label: 'Overdue Tasks',
            value: '. . .',
            color: 'text-red-600 bg-red-100',
          },
          {
            icon: BarChart2,
            label: 'Approval Rate',
            value: '. . .',
            color: 'text-violet-600 bg-violet-100',
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center py-16 gap-2 border rounded-xl">
        <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm font-medium">
          Charts coming soon
        </p>
        <p className="text-xs text-muted-foreground">
          Time logs, task completion trends, approval rates
        </p>
      </div>
    </div>
  );
}

export default ProjectReportsPage;
