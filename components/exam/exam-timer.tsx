'use client';

interface ExamTimerProps {
  timeLeft: number;
  duration: number;
}

export function ExamTimer({ timeLeft, duration }: ExamTimerProps) {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const percentage = (timeLeft / (duration * 60)) * 100;
  const isWarning = percentage < 20;
  const isDanger = percentage < 10;

  return (
    <div className="text-center">
      <div className={`text-3xl font-mono font-bold ${isDanger ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-900'}`}>
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </div>
      <p className="text-sm text-gray-600 mt-1">Time Remaining</p>
      <div className="mt-2 w-32 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div
          className={`h-full transition-all ${isDanger ? 'bg-red-600' : isWarning ? 'bg-orange-600' : 'bg-blue-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
