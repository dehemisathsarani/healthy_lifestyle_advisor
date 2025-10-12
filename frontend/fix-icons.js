#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icon mapping from react-icons/fa to react-icons/hi2
const iconMap = {
  // Import changes
  "from 'react-icons/fa'": "from 'react-icons/hi2'",
  "from 'react-icons/fa6'": "from 'react-icons/hi2'",
  
  // Individual icon mappings
  'FaPaperPlane': 'HiPaperAirplane',
  'FaTimes': 'HiXMark',
  'FaXmark': 'HiXMark',
  'FaRobot': 'HiCpuChip',
  'FaCog': 'HiCog',
  'FaGear': 'HiCog',
  'FaMoon': 'HiMoon',
  'FaSun': 'HiSun',
  'FaVolumeUp': 'HiSpeakerWave',
  'FaVolumeHigh': 'HiSpeakerWave',
  'FaVolumeMute': 'HiSpeakerXMark',
  'FaVolumeXmark': 'HiSpeakerXMark',
  'FaMicrophone': 'HiMicrophone',
  'FaMicrophoneSlash': 'HiOutlineMicrophone',
  'FaLightbulb': 'HiLightBulb',
  'FaDumbbell': 'HiCpuChip', // No direct equivalent, using cpu chip
  'FaTint': 'HiDroplet',
  'FaDroplet': 'HiDroplet',
  'FaStar': 'HiStar',
  'FaAppleAlt': 'HiCake',
  'FaAppleWhole': 'HiCake',
  'FaCalendarAlt': 'HiCalendar',
  'FaCalendar': 'HiCalendar',
  'FaChartBar': 'HiChartBar',
  'FaChartLine': 'HiPresentationChartLine',
  'FaHistory': 'HiClock',
  'FaClockRotateLeft': 'HiClock',
  'FaBrain': 'HiAcademicCap',
  'FaCircle': 'HiStop', // Using stop as circle alternative
  'FaPlay': 'HiPlay',
  'FaBed': 'HiHome', // No bed icon, using home
  'FaClock': 'HiClock',
  'FaUser': 'HiUser',
  'FaSignOutAlt': 'HiArrowRightOnRectangle',
  'FaPowerOff': 'HiArrowRightOnRectangle',
  'FaCheckCircle': 'HiCheckCircle',
  'FaCircleCheck': 'HiCheckCircle',
  'FaExclamationTriangle': 'HiExclamationTriangle',
  'FaTriangleExclamation': 'HiExclamationTriangle',
  'FaInfoCircle': 'HiInformationCircle',
  'FaCircleInfo': 'HiInformationCircle',
  'FaTimesCircle': 'HiXCircle',
  'FaCircleXmark': 'HiXCircle',
  'FaFlag': 'HiFlag',
  'FaExchangeAlt': 'HiArrowsUpDown',
  'FaArrowRightArrowLeft': 'HiArrowsUpDown',
  'FaTrophy': 'HiTrophy',
  'FaQuoteLeft': 'HiChatBubbleLeftEllipsis'
};

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply all mappings
    for (const [oldIcon, newIcon] of Object.entries(iconMap)) {
      if (content.includes(oldIcon)) {
        content = content.replace(new RegExp(oldIcon, 'g'), newIcon);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    } else {
      console.log(`No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Files to update
const filesToUpdate = [
  'src/components/NutritionChatbotEnhanced.tsx',
  'src/components/NutritionChatbotMinimal.tsx', 
  'src/components/NutritionChatbotSimple.tsx',
  'src/components/NLPNutritionInsights.tsx',
  'src/pages/DashboardPage.tsx',
  'src/pages/ProfilePage.tsx'
];

console.log('Updating icon imports...\n');
filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    updateFile(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('\nIcon update complete!');
