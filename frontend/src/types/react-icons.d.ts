declare module 'react-icons/fa' {
  import { ComponentType, SVGProps } from 'react';
  
  export const FaAppleAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaUserCircle: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaDumbbell: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaTimes: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaRobot: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaPaperPlane: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaTimesCircle: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaExclamationTriangle: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaInfoCircle: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaCheckCircle: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaBrain: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaLightbulb: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaExchangeAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaTrophy: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaFlag: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaQuoteLeft: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaMicrophone: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaCog: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaSun: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaMoon: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaVolumeUp: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaVolumeMute: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaMicrophoneSlash: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaHome: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaEnvelope: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaUser: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaLock: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaArrowRight: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaLinkedin: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaTwitter: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaInstagram: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaFacebook: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaYoutube: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaGithub: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaHashtag: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaGlobe: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaPhone: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaAt: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaEyeSlash: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaEye: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaSignOutAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaCalendarAlt: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaChartLine: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaClock: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaBed: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaTint: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaPlus: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaChartBar: ComponentType<SVGProps<SVGSVGElement>>;
  export const FaHistory: ComponentType<SVGProps<SVGSVGElement>>;
}

declare module 'react-icons/fa6' {
  import { ComponentType, SVGProps } from 'react';
  
  // Add any Fa6 icons that might be used
  export const FaApple: ComponentType<SVGProps<SVGSVGElement>>;
}

declare module 'react-icons' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconBaseProps extends SVGProps<SVGSVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }
  
  export type IconType = ComponentType<IconBaseProps>;
}
