import './heatmap.css';

/**
 * Render a GitHub-style contribution heatmap from daily contribution data.
 *
 * Displays total contributions, month labels, a grid grouped by weeks, and a legend.
 *
 * @param {{date: string, contributionCount: number}[]} data - Array of daily contribution objects ordered chronologically; each item must include `date` (ISO date string) and `contributionCount` (non-negative integer). If `data` is empty or missing, a placeholder message is shown.
 * @returns {JSX.Element} A React element containing the heatmap visualization.
 */
function Heatmap({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="heatmap">
        <p>No contribution data available</p>
      </div>
    );
  }

  // Calculate total contributions
  const totalContributions = data.reduce((sum, day) => sum + day.contributionCount, 0);

  // Ensure we have at least 365 days for a full year view, or use available data
  // GitHub usually shows the last year (52-53 weeks)
  const recentData = data;
  
  // Group days into weeks (7 days each)
  const weeks = [];
  for (let i = 0; i < recentData.length; i += 7) {
    weeks.push(recentData.slice(i, i + 7));
  }

  // Get month labels for the display
  const getMonthLabel = (dateStr) => {
    const date = new Date(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()];
  };

  // Group by months for labels
  const monthLabels = [];
  let currentMonth = '';
  weeks.forEach((week, weekIndex) => {
    if (week[0]) {
      const month = getMonthLabel(week[0].date);
      if (month !== currentMonth) {
        // Only add label if it's far enough from the previous one (approx 4 weeks)
        // GitHub's logic is a bit more complex but this approximates it
        if (monthLabels.length === 0 || weekIndex - monthLabels[monthLabels.length - 1].weekIndex > 3) {
          monthLabels.push({ month, weekIndex });
          currentMonth = month;
        }
      }
    }
  });

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <span>{totalContributions} contributions in the last year</span>
      </div>
      
      <div className="heatmap-body">
        <div className="day-labels">
          <span className="day-label">Mon</span>
          <span className="day-label">Wed</span>
          <span className="day-label">Fri</span>
        </div>

        <div className="heatmap-content">
          <div className="heatmap-months">
            {monthLabels.map((label, idx) => (
              <span 
                key={idx} 
                className="month-label"
                style={{ left: `${label.weekIndex * 14}px` }} // 14px = 11px box + 3px gap
              >
                {label.month}
              </span>
            ))}
          </div>
          
          <div className="heatmap-grid" key={data.length}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {week.map((day, dayIndex) => {
                  const count = day.contributionCount;
                  const level = count === 0 ? 0 : 
                               count < 3 ? 1 : 
                               count < 6 ? 2 : 
                               count < 9 ? 3 : 4;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`heatmap-day level-${level}`}
                      data-tooltip={day ? `${day.contributionCount} contributions on ${day.date}` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-footer">
        <div className="legend">
          <span>Less</span>
          <div className="heatmap-day level-0"></div>
          <div className="heatmap-day level-1"></div>
          <div className="heatmap-day level-2"></div>
          <div className="heatmap-day level-3"></div>
          <div className="heatmap-day level-4"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default Heatmap;