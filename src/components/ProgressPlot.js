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
  TimeScale, // Import TimeScale
} from "chart.js";
import "chartjs-adapter-date-fns"; // Import the adapter

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

function ProgressPlot({ learnedWordHistory }) {
  const data = {
    // Use timestamps directly for the x-axis data points
    datasets: [
      {
        label: "Learned Words",
        // Map history to {x: timestamp, y: count} format
        data: learnedWordHistory.map((entry) => ({ x: entry[0], y: entry[1] })),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom height/width
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Learned Words Over Time",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            // Optional: Format date on hover
            // const dateLabel = new Date(context.parsed.x).toLocaleDateString();
            // return `${dateLabel} - ${label}`;
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time", // Set x-axis type to 'time'
        time: {
          unit: "day", // Display units in days
          tooltipFormat: "PPpp", // Format for tooltips (requires date-fns)
          displayFormats: {
            // Formatting for axis labels
            day: "MMM d", // e.g., "Jan 5"
            week: "MMM d",
            month: "MMM yyyy",
          },
        },
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10, // Limit the number of ticks for readability
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Words Learned",
        },
        // Ensure y-axis shows integer steps if desired
        ticks: {
          stepSize: Math.max(
            1,
            Math.ceil(
              (learnedWordHistory[learnedWordHistory.length - 1]?.[1] || 1) / 10
            )
          ), // Adjust step size dynamically or set to 1
          precision: 0, // No decimal places
        },
      },
    },
    // Add interaction options if needed, e.g., for zooming/panning
    // interaction: {
    //     mode: 'index',
    //     intersect: false,
    // },
    // stacked: false, // Ensure lines aren't stacked if using multiple datasets later
  };

  // Add a container with a fixed height for better layout
  return (
    <div
      className="progress-plot-container"
      style={{ height: "300px", marginTop: "30px", marginBottom: "20px" }}
    >
      {learnedWordHistory.length > 1 ? ( // Only render if there's data to plot
        <Line options={options} data={data} />
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>
          Not enough data to display progress plot yet.
        </p>
      )}
    </div>
  );
}

export default ProgressPlot;
