import SourceContribution from '../../components/policy/SourceContribution';

export default function PolicySourceContribution() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2" style={{ color: '#0F172A' }}>
          Source Contribution Breakdown
        </h2>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Detailed analysis of pollution sources and their contributions
        </p>
      </div>
      <SourceContribution />
    </div>
  );
}

