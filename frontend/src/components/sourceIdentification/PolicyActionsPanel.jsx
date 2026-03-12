function PolicyActionsPanel({ data }) {
  // Extract policy actions from data
  const getActions = () => {
    const actions = [];
    
    if (data?.vehicular?.policyActions) {
      actions.push({
        source: 'Vehicular',
        actions: data.vehicular.policyActions,
        color: 'green',
      });
    }
    
    if (data?.industrial?.policyActions) {
      actions.push({
        source: 'Industrial',
        actions: data.industrial.policyActions,
        color: 'orange',
      });
    }
    
    if (data?.construction?.policyActions) {
      actions.push({
        source: 'Construction',
        actions: data.construction.policyActions,
        color: 'blue',
      });
    }
    
    if (data?.biomass?.policyActions) {
      actions.push({
        source: 'Biomass',
        actions: data.biomass.policyActions,
        color: 'red',
      });
    }
    
    return actions;
  };

  const actionGroups = getActions();

  if (actionGroups.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">
          Policy Action Recommendations
        </h2>
        <p className="text-gray-600">
          No specific policy actions available at this time.
        </p>
      </div>
    );
  }

  const colorClasses = {
    green: {
      borderLeft: 'border-l-[#2E7D32]',
      text: 'text-[#2E7D32]',
      bullet: 'bg-[#2E7D32]',
    },
    orange: {
      borderLeft: 'border-l-[#EF6C00]',
      text: 'text-[#EF6C00]',
      bullet: 'bg-[#EF6C00]',
    },
    blue: {
      borderLeft: 'border-l-[#1565C0]',
      text: 'text-[#1565C0]',
      bullet: 'bg-[#1565C0]',
    },
    red: {
      borderLeft: 'border-l-[#C62828]',
      text: 'text-[#C62828]',
      bullet: 'bg-[#C62828]',
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 text-black">
        Policy Action Recommendations
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Based on microscopic source identification, here are immediate actions recommended for each pollution source:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {actionGroups.map((group, groupIdx) => {
          const colors = colorClasses[group.color] || colorClasses.green;
          return (
            <div
              key={groupIdx}
              className={`bg-white border border-gray-200 rounded-xl p-5 border-l-4 ${colors.borderLeft}`}
            >
              <h3 className={`font-semibold ${colors.text} mb-3 text-lg`}>
                {group.source} Pollution
              </h3>
              <ul className="space-y-2">
                {group.actions.map((action, actionIdx) => (
                  <li key={actionIdx} className="flex items-start gap-3">
                    <span className={`${colors.bullet} w-2 h-2 rounded-full mt-2 flex-shrink-0`} />
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> These recommendations are derived from microscopic pollution source analysis
          using official data sources (VAHAN, CPCB, DPCC, NASA FIRMS, IMD). Actions should be validated
          with local environmental authorities before implementation.
        </p>
      </div>
    </div>
  );
}

export default PolicyActionsPanel;

