import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Keep TimeScale
} from "chart.js";
import "chartjs-adapter-date-fns"; // Keep adapter

// Register Chart.js components (keep existing registrations)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function ProgressPlot({ learnedWordHistory }) {
  // Ensure data is sorted by timestamp just in case (backend should do this, but defensive)
  const sortedHistory = learnedWordHistory.sort((a, b) => a[0] - b[0]);

  const data = {
    datasets: [
      {
        label: "Learned Words",
        // Map history to {x: timestamp, y: count} format
        data: sortedHistory.map((entry) => ({ x: entry[0], y: entry[1] })),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1, // Slight curve
        pointRadius: 3, // Make points slightly visible
        pointHoverRadius: 5, // Larger on hover
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows custom height via container
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Learned Words Over Time",
        font: {
          size: 16,
        },
      },
      tooltip: {
        mode: "index", // Show tooltip for all datasets at that index
        intersect: false, // Trigger tooltip even if not directly hovering point
        callbacks: {
          // Display date as title of tooltip
          title: function (tooltipItems) {
            const timestamp = tooltipItems[0]?.parsed?.x;
            if (timestamp) {
              return new Date(timestamp).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }); // More detailed date format
            }
            return "";
          },
          // Display "Learned Words: Count"
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time", // Use time scale
        time: {
          unit: "day", // Sensible default unit
          tooltipFormat: "PPpp", // Format for tooltip internal value (date-fns)
          displayFormats: {
            // How labels appear on the axis
            millisecond: "h:mm:ss.SSS a",
            second: "h:mm:ss a",
            minute: "h:mm a",
            hour: "ha",
            day: "MMM d", // e.g., "Jan 5"
            week: "MMM d yyyy",
            month: "MMM yyyy", // e.g., "Jan 2024"
            quarter: "[Q]Q yyyy",
            year: "yyyy",
          },
        },
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          autoSkip: true, // Automatically skip labels to prevent overlap
          maxTicksLimit: 10, // Limit density of labels
          major: {
            enabled: true, // Potentially enable major ticks later if needed
          },
        },
      },
      y: {
        beginAtZero: true, // Start y-axis at 0
        title: {
          display: true,
          text: "Number of Words Learned",
        },
        ticks: {
          // Calculate step size dynamically based on max value, ensure integer steps
          stepSize: Math.max(
            1,
            Math.ceil(
              (Math.max(...sortedHistory.map((e) => e[1]), 0) || 1) / 10
            )
          ),
          precision: 0, // Display whole numbers only
        },
      },
    },
    interaction: {
      // Improve hover/tooltip experience
      mode: "index",
      intersect: false,
    },
  };

  // Container with fixed height for better layout control
  return (
    <div
      className="progress-plot-container"
      style={{
        position: "relative",
        height: "300px",
        marginTop: "30px",
        marginBottom: "20px",
      }}
    >
      {/* Render only if there are at least 2 data points to draw a line */}
      {learnedWordHistory && learnedWordHistory.length > 1 ? (
        <Line options={options} data={data} />
      ) : (
        <p style={{ textAlign: "center", color: "#666", marginTop: "50px" }}>
          Keep learning! More progress data needed to display the plot (at least
          2 points).
        </p>
      )}
    </div>
  );
}

export default ProgressPlot;
