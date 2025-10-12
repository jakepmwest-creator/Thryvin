import { useMemo } from "react";

interface ProgressCardProps {
  completedWorkouts: number;
  goalWorkouts: number;
  trainingMinutes: number;
  goalMinutes: number;
  coachType: string;
}

const ProgressCard = ({
  completedWorkouts,
  goalWorkouts,
  trainingMinutes,
  goalMinutes,
  coachType
}: ProgressCardProps) => {
  // Calculate progress percentages
  const workoutPercentage = Math.min(100, Math.round((completedWorkouts / goalWorkouts) * 100));
  const minutesPercentage = Math.min(100, Math.round((trainingMinutes / goalMinutes) * 100));
  
  // Get days of the week
  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const currentDayIndex = new Date().getDay();
  
  // Adjust to have Monday as first day (0 = Monday, 6 = Sunday)
  const adjustedCurrentDay = (currentDayIndex === 0) ? 6 : currentDayIndex - 1;
  
  // Create array to track completion status for days of the week
  // For this demo, we'll mark days before today as completed
  const dayStatus = useMemo(() => {
    return daysOfWeek.map((_, index) => {
      if (index < adjustedCurrentDay) {
        // Days before today are completed if we have enough completedWorkouts
        return index < completedWorkouts ? "completed" : "missed";
      } else if (index === adjustedCurrentDay) {
        // Today is active
        return "active";
      } else {
        // Future days are upcoming
        return "upcoming";
      }
    });
  }, [completedWorkouts, adjustedCurrentDay]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex">
        <div className="w-1/2 border-r border-gray-100 pr-4">
          <div className="text-sm text-gray-500 mb-1">Workouts Completed</div>
          <div className="flex items-end">
            <div className="text-2xl font-bold">{completedWorkouts}</div>
            <div className="text-sm text-gray-500 ml-2 mb-1">/ {goalWorkouts} goal</div>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-${coachType} rounded-full`} 
              style={{ width: `${workoutPercentage}%` }}
            ></div>
          </div>
        </div>
        <div className="w-1/2 pl-4">
          <div className="text-sm text-gray-500 mb-1">Training Minutes</div>
          <div className="flex items-end">
            <div className="text-2xl font-bold">{trainingMinutes}</div>
            <div className="text-sm text-gray-500 ml-2 mb-1">/ {goalMinutes} goal</div>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-${coachType} rounded-full`} 
              style={{ width: `${minutesPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        {daysOfWeek.map((day, index) => (
          <div key={index} className="text-center w-1/7">
            <div className="text-xs text-gray-500">{day}</div>
            <div 
              className={`mt-1 mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                dayStatus[index] === "completed" 
                  ? `bg-${coachType}/20 text-${coachType}` 
                  : dayStatus[index] === "active"
                    ? `bg-${coachType}/10 text-${coachType}/70`
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {dayStatus[index] === "completed" ? (
                <i className="fas fa-check"></i>
              ) : dayStatus[index] === "missed" ? (
                <i className="fas fa-times"></i>
              ) : (
                <i className="fas fa-circle text-[6px]"></i>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressCard;
