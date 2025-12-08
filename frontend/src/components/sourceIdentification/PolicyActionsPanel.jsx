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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Policy Action Recommendations
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No specific policy actions available at this time.
        </p>
      </div>
    );
  }

  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-300',
      bullet: 'bg-green-500',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-800 dark:text-orange-300',
      bullet: 'bg-orange-500',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      bullet: 'bg-blue-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      bullet: 'bg-red-500',
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Policy Action Recommendations
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Based on microscopic source identification, here are immediate actions recommended for each pollution source:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionGroups.map((group, groupIdx) => {
          const colors = colorClasses[group.color] || colorClasses.green;
          return (
            <div
              key={groupIdx}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
            >
              <h3 className={`font-semibold ${colors.text} mb-3 text-lg`}>
                {group.source} Pollution
              </h3>
              <ul className="space-y-2">
                {group.actions.map((action, actionIdx) => (
                  <li key={actionIdx} className="flex items-start gap-2">
                    <span className={`${colors.bullet} w-2 h-2 rounded-full mt-2 flex-shrink-0`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> These recommendations are derived from microscopic pollution source analysis
          using official data sources (VAHAN, CPCB, DPCC, NASA FIRMS, IMD). Actions should be validated
          with local environmental authorities before implementation.
        </p>
      </div>
    </div>
  );
}

export default PolicyActionsPanel;

