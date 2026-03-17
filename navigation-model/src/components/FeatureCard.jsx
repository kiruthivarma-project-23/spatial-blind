import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05 }}
      className="glass-card p-6 rounded-2xl flex flex-col items-center text-center gap-4 cursor-pointer"
    >
      <div className="p-4 rounded-full bg-[rgba(0,224,255,0.1)] text-[var(--color-neon)] text-4xl shadow-[0_0_15px_rgba(0,224,255,0.3)]">
        <Icon />
      </div>
      <h3 className="text-xl font-bold tracking-wider">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;
