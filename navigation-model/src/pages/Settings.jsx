/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMicrophone, FaMobileAlt, FaVolumeUp, FaAdjust } from 'react-icons/fa';

// eslint-disable-next-line no-unused-vars
const SettingsOption = ({ icon: OptionIcon, title, description, checked, onChange }) => {
  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-[rgba(0,224,255,0.1)] text-[var(--color-neon)] text-2xl">
          <OptionIcon />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-wider">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--color-neon)]"></div>
      </label>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto flex flex-col gap-8">
      
      <div className="flex items-center gap-6 mt-8">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={() => navigate('/')} 
          className="p-4 rounded-full border border-[var(--color-neon)] text-[var(--color-neon)] hover:bg-[var(--color-neon)] hover:text-black transition-all"
        >
          <FaArrowLeft size={24} />
        </motion.button>
        <h1 className="text-4xl font-extrabold tracking-widest neon-text">SETTINGS</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <SettingsOption 
          icon={FaMicrophone} 
          title="Voice Assistant" 
          description="Enable or disable voice commands and speech synthesis."
          checked={true}
          onChange={() => {}}
        />
        
        <SettingsOption 
          icon={FaMobileAlt} 
          title="Vibration Alerts" 
          description="Trigger haptic feedback when obstacles are very close."
          checked={true}
          onChange={() => {}}
        />

        <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[rgba(0,224,255,0.1)] text-[var(--color-neon)] text-2xl">
              <FaVolumeUp />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-wider">Audio Volume</h3>
              <p className="text-gray-400 text-sm">Adjust the volume of spatial audio alerts.</p>
            </div>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="80"
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-neon)]"
          />
        </div>

        <SettingsOption 
          icon={FaAdjust} 
          title="High Contrast Mode" 
          description="Increase the contrast of the user interface for better visibility."
          checked={false}
          onChange={() => {}}
        />

      </motion.div>
    </div>
  );
};

export default Settings;
