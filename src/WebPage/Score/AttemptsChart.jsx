import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register all required components including CONTROLLERS
ChartJS.register(
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

const AttemptsChart = ({ attempts }) => {
  // Memoize processed data to prevent unnecessary recalculations
  const { labels, scores, percentages, maxQuestions, formattedDates } = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return {
        labels: [],
        scores: [],
        percentages: [],
        maxQuestions: 1,
        formattedDates: []
      };
    }

    const sortedAttempts = [...attempts].sort((a, b) => 
      a.timestamp?.seconds - b.timestamp?.seconds
    );

    return {
      labels: sortedAttempts.map((_, index) => `Attempt ${index + 1}`),
      scores: sortedAttempts.map(attempt => attempt.score),
      percentages: sortedAttempts.map(attempt => 
        Math.round((attempt.score / attempt.totalQuestions) * 100)
      ),
      maxQuestions: sortedAttempts[0]?.totalQuestions || 1,
      formattedDates: sortedAttempts.map(attempt => 
        new Date(attempt.timestamp?.seconds * 1000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      )
    };
  }, [attempts]);

  // If no attempts, show empty state
  if (!attempts || attempts.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Quiz Performance Timeline</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No attempt data available</p>
        </div>
      </div>
    );
  }

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Score',
        data: scores,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Percentage',
        data: percentages,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
        fill: false,
      }
    ]
  }), [labels, scores, percentages]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return formattedDates[context[0].dataIndex];
          },
          label: (context) => {
            let label = context.dataset.label || '';
            label += ': ';
            label += context.datasetIndex === 0 
              ? `${context.raw}/${maxQuestions}` 
              : `${context.raw}%`;
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { 
          display: true, 
          text: 'Score',
          color: 'rgba(54, 162, 235, 1)',
          font: { weight: 'bold' }
        },
        max: maxQuestions,
        min: 0,
        ticks: {
          color: 'rgba(54, 162, 235, 1)'
        },
        grid: {
          color: 'rgba(54, 162, 235, 0.1)'
        }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { 
          display: true, 
          text: 'Percentage (%)',
          color: 'rgba(255, 99, 132, 1)',
          font: { weight: 'bold' }
        },
        max: 100,
        min: 0,
        grid: { 
          drawOnChartArea: false 
        },
        ticks: {
          color: 'rgba(255, 99, 132, 1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Attempts',
          font: { weight: 'bold' }
        }
      }
    }
  }), [formattedDates, maxQuestions]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Quiz Performance Timeline</h3>
      <div className="h-64">
        <Chart 
          type='bar' 
          data={data} 
          options={options} 
          fallbackContent={
            <div className="text-center py-8 text-gray-500">
              Loading chart...
            </div>
          }
        />
      </div>
      <div className="mt-2 text-sm text-gray-500 text-center">
        {attempts.length > 0 && (
          `From ${formattedDates[0]} to ${formattedDates[formattedDates.length - 1]}`
        )}
      </div>
    </div>
  );
};

export default React.memo(AttemptsChart);