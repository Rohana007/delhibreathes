import { motion } from 'framer-motion';
import PolicyOverview from '../../components/policy/PolicyOverview';
import ZoneAnalysis from '../../components/policy/ZoneAnalysis';
import ActionCards from '../../components/policy/ActionCards';
import GRAPStatus from '../../components/policy/GRAPStatus';
import TrendingZones from '../../components/policy/TrendingZones';
import EarlyWarning from '../../components/policy/EarlyWarning';
import ResourceAllocation from '../../components/policy/ResourceAllocation';
import SourceContribution from '../../components/policy/SourceContribution';
import PolicySimulatorCard from '../../components/policy/PolicySimulatorCard';

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
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Policy Overview */}
      <motion.div variants={itemVariants}>
        <PolicyOverview />
      </motion.div>

      {/* Policy Simulator Card */}
      <motion.div variants={itemVariants}>
        <PolicySimulatorCard />
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

