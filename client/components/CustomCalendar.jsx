import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CustomCalendar = ({ isOpen, onClose, selectedDate, onDateSelect, label = "Select Date" }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({
    hours: '08',
    minutes: '00',
    period: 'AM'
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - (startingDayOfWeek - 1 - i));
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDay
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day)
      });
    }

    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: nextMonthDay
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      const finalDateTime = new Date(day.fullDate);
      const hours = selectedTime.period === 'AM' ? 
        (selectedTime.hours === '12' ? 0 : parseInt(selectedTime.hours)) :
        (selectedTime.hours === '12' ? 12 : parseInt(selectedTime.hours) + 12);
      
      finalDateTime.setHours(hours, parseInt(selectedTime.minutes), 0, 0);
      
      // Format for datetime-local input
      const formattedDate = finalDateTime.toISOString().slice(0, 16);
      onDateSelect(formattedDate);
      onClose();
    }
  };

  const incrementTime = (field) => {
    setSelectedTime(prev => {
      const newTime = { ...prev };
      if (field === 'hours') {
        const hours = parseInt(prev.hours);
        newTime.hours = (hours % 12 + 1).toString().padStart(2, '0');
        if (newTime.hours === '00') newTime.hours = '12';
      } else if (field === 'minutes') {
        const minutes = parseInt(prev.minutes);
        newTime.minutes = ((minutes + 1) % 60).toString().padStart(2, '0');
      } else if (field === 'period') {
        newTime.period = prev.period === 'AM' ? 'PM' : 'AM';
      }
      return newTime;
    });
  };

  const decrementTime = (field) => {
    setSelectedTime(prev => {
      const newTime = { ...prev };
      if (field === 'hours') {
        const hours = parseInt(prev.hours);
        newTime.hours = (hours === 1 ? 12 : hours - 1).toString().padStart(2, '0');
        if (newTime.hours === '00') newTime.hours = '12';
      } else if (field === 'minutes') {
        const minutes = parseInt(prev.minutes);
        newTime.minutes = (minutes === 0 ? 59 : minutes - 1).toString().padStart(2, '0');
      } else if (field === 'period') {
        newTime.period = prev.period === 'AM' ? 'PM' : 'AM';
      }
      return newTime;
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 border border-gray-600 rounded-lg p-6 w-96 max-w-sm mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium text-lg">{label}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FiChevronLeft size={20} />
          </button>
          <h4 className="text-white font-medium text-lg">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth(1)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FiChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-gray-400 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={`
                  w-8 h-8 text-sm rounded transition-all
                  ${day.isCurrentMonth 
                    ? 'text-white hover:bg-gray-700' 
                    : 'text-gray-600 cursor-not-allowed'
                  }
                  ${day.isCurrentMonth && 
                    day.fullDate.toDateString() === today.toDateString()
                    ? 'bg-blue-600 text-white' 
                    : ''
                  }
                `}
                disabled={!day.isCurrentMonth}
              >
                {day.date}
              </button>
            ))}
          </div>
        </div>

        {/* Time Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-white">
            <span className="text-sm">Hours</span>
            <span className="text-sm">Minutes</span>
            <span className="text-sm">Period</span>
          </div>

          <div className="flex items-center justify-between">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => incrementTime('hours')}
                className="text-white hover:text-gray-300 mb-1"
              >
                <FiChevronRight className="rotate-[-90deg]" size={16} />
              </button>
              <div className="text-white text-lg font-mono bg-gray-800 px-3 py-1 rounded">
                {selectedTime.hours}
              </div>
              <button
                onClick={() => decrementTime('hours')}
                className="text-white hover:text-gray-300 mt-1"
              >
                <FiChevronRight className="rotate-[90deg]" size={16} />
              </button>
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => incrementTime('minutes')}
                className="text-white hover:text-gray-300 mb-1"
              >
                <FiChevronRight className="rotate-[-90deg]" size={16} />
              </button>
              <div className="text-white text-lg font-mono bg-gray-800 px-3 py-1 rounded">
                {selectedTime.minutes}
              </div>
              <button
                onClick={() => decrementTime('minutes')}
                className="text-white hover:text-gray-300 mt-1"
              >
                <FiChevronRight className="rotate-[90deg]" size={16} />
              </button>
            </div>

            {/* Period */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => incrementTime('period')}
                className="text-white hover:text-gray-300 mb-1"
              >
                <FiChevronRight className="rotate-[-90deg]" size={16} />
              </button>
              <div className="text-white text-lg font-mono bg-gray-800 px-3 py-1 rounded">
                {selectedTime.period}
              </div>
              <button
                onClick={() => decrementTime('period')}
                className="text-white hover:text-gray-300 mt-1"
              >
                <FiChevronRight className="rotate-[90deg]" size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomCalendar;