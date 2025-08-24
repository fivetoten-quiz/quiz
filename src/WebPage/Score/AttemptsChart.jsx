import React, { useMemo } from 'react';
import { Chart as ChartJS, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
);

const AttemptsChart = ({ attempts }) => {
  // Memoize processed data to prevent unnecessary recalculations
  const { labels, scores, percentages, maxQuestions, formattedDates } = useMemo(() => {
    const sortedAttempts = [...attempts].sort((a, b) => 
      a.timestamp?.seconds - b.timestamp?.seconds
    );

    return {
      labels: sortedAttempts.map((_, index) => `Attempt ${index + 1}`),
      scores: sortedAttempts.map(attempt => attempt.score),
      percentages: sortedAttempts.map(attempt => attempt.percentage),
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
      }
    ]
  }), [labels, scores, percentages]);

  const options = useMemo(() => ({
    responsive: true,
    animation: {
      duration: 2000, // Reduced animation time for faster rendering
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
        title: { display: true, text: 'Score' },
        max: maxQuestions,
        min: 0
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Percentage (%)' },
        max: 100,
        min: 0,
        grid: { drawOnChartArea: false },
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
          fallbackContent={<div className="text-center py-8">Loading chart...</div>}
        />
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {attempts.length > 0 && (
          `From ${formattedDates[0]} to ${formattedDates[formattedDates.length - 1]}`
        )}
      </div>
    </div>
  );
};

export default React.memo(AttemptsChart);