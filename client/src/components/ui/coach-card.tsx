import { useUser } from "@/context/UserContext";

interface CoachCardProps {
  name: string;
  role: string;
  description: string;
  icon: string;
  colorClass: string;
  rating: number;
  members: string;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

const CoachCard = ({
  name,
  role,
  description,
  icon,
  colorClass,
  rating,
  members,
  isSelected,
  onSelect,
  compact = false
}: CoachCardProps) => {
  // Generate full stars
  const fullStars = Math.floor(rating);
  // Determine if there should be a half star
  const hasHalfStar = rating % 1 >= 0.3;
  
  return (
    <div 
      className={`coach-card relative rounded-2xl overflow-hidden border-2 border-transparent hover:border-${colorClass} cursor-pointer ${isSelected ? `selected border-${colorClass}` : ''}`}
      onClick={onSelect}
    >
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-r from-${colorClass} to-yellow-500`}></div>
      <div className={`p-${compact ? '3' : '5'} flex`}>
        <div className={`w-${compact ? '12' : '16'} h-${compact ? '12' : '16'} rounded-full bg-${colorClass} flex items-center justify-center text-white`}>
          <i className={`fas ${icon} text-${compact ? 'xl' : '2xl'}`}></i>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-xl text-gray-900">{name}</h3>
              <div className="flex items-center">
                <span className={`text-sm font-medium text-${colorClass}`}>{role}</span>
              </div>
            </div>
            <div className={`coach-check w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center ${isSelected ? `bg-${colorClass} border-${colorClass}` : ''}`}>
              <i className={`fas fa-check text-white ${isSelected ? '' : 'hidden'}`}></i>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {description}
          </p>
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <div className="mr-4">
              {Array(5).fill(0).map((_, i) => (
                <i 
                  key={i} 
                  className={`fas ${
                    i < fullStars 
                      ? 'fa-star text-yellow-400' 
                      : i === fullStars && hasHalfStar 
                        ? 'fa-star-half-alt text-yellow-400' 
                        : 'fa-star text-gray-300'
                  }`}
                ></i>
              ))}
              <span className="ml-1">{rating}</span>
            </div>
            <div>
              <i className="fas fa-user"></i>
              <span className="ml-1">{members} members</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachCard;
