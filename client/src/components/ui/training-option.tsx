import { motion } from "framer-motion";

interface TrainingOptionProps {
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  isSelected: boolean;
  onSelect: () => void;
}

const TrainingOption = ({
  title,
  description,
  icon,
  colorClass,
  isSelected,
  onSelect,
}: TrainingOptionProps) => {
  return (
    <motion.div
      className={`p-4 border ${
        isSelected ? `border-${colorClass} bg-opacity-5 ${colorClass}` : "border-gray-200"
      } rounded-xl flex items-center cursor-pointer`}
      onClick={onSelect}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass} bg-opacity-20 text-${colorClass}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="ml-4">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="ml-auto">
        <div className={`w-6 h-6 rounded-full ${
          isSelected ? `${colorClass} border` : "border-2 border-gray-300"
        } flex items-center justify-center`}>
          <i className={`fas fa-check text-white ${isSelected ? "" : "hidden"}`}></i>
        </div>
      </div>
    </motion.div>
  );
};

export default TrainingOption;
