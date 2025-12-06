import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PolicyOverview from '../policy/PolicyOverview';
import ZoneAnalysis from '../policy/ZoneAnalysis';
import ActionCards from '../policy/ActionCards';
import GRAPStatus from '../policy/GRAPStatus';
import TrendingZones from '../policy/TrendingZones';
import EarlyWarning from '../policy/EarlyWarning';
import ResourceAllocation from '../policy/ResourceAllocation';
import SourceContribution from '../policy/SourceContribution';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PolicyDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear policy access and user auth
    localStorage.removeItem('policyAccess');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Redirect to start page
    navigate('/start');
    window.location.reload();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Logout Button Header */}
      <motion.div variants={itemVariants} className="flex justify-end">
        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all"
          style={{
            backgroundColor: 'var(--card-bg, #FFFFFF)',
            borderColor: '#DC2626',
            color: '#DC2626',
          }}
          whileHover={{ 
            scale: 1.02,
            backgroundColor: '#FEF2F2',
            borderColor: '#DC2626'
          }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </motion.div>
      {/* Policy Overview */}
      <motion.div variants={itemVariants}>
        <PolicyOverview />
      </motion.div>

      {/* GRAP Status and Early Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <GRAPStatus />
        </motion.div>
        <motion.div variants={itemVariants}>
          <EarlyWarning />
        </motion.div>
      </div>

      {/* Zone Analysis and Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <ZoneAnalysis />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TrendingZones />
        </motion.div>
      </div>

      {/* Source Contribution Breakdown */}
      <motion.div variants={itemVariants}>
        <SourceContribution />
      </motion.div>

      {/* Action Cards and Resource Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ActionCards />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ResourceAllocation />
        </motion.div>
      </div>
    </motion.div>
  );
}

