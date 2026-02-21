/**
 * ChartRenderer Component
 * Renders different chart types using Recharts library
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  type: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'network';
  data: any[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  nodes?: any[];
  edges?: any[];
}

interface ChartRendererProps {
  data: ChartData;
  width?: number;
  height?: number;
  interactive?: boolean;
}

const COLORS = [
  '#8884d8',
  '#82ca9d', 
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#87d068',
  '#ffb347'
];

export function ChartRenderer({ data, width = 800, height = 400, interactive = true }: ChartRendererProps) {
  
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="x" 
          label={{ value: data.xAxisLabel || '', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: data.yAxisLabel || '', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        {interactive && <Legend />}
        <Line 
          type="monotone" 
          dataKey="y" 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="x" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area 
          type="monotone" 
          dataKey="y" 
          stroke="#8884d8" 
          fillOpacity={1} 
          fill="url(#colorGradient)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis />
        <Tooltip />
        {interactive && <Legend />}
        <Bar dataKey="y" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="x" />
        <YAxis type="number" dataKey="y" name="y" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Data Points" data={data.data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    // Transform data for pie chart if needed
    const pieData = data.data.map((item, index) => ({
      name: item.name || item.x || `Item ${index + 1}`,
      value: item.value || item.y || 0
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderNetworkChart = () => {
    // For network charts, we'll create a simple node representation
    // In a real implementation, you'd use a library like D3.js or vis.js
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ width: '100%', height }}
      >
        <div className="text-center">
          <div className="text-gray-600 mb-2">Network Visualization</div>
          <div className="text-sm text-gray-500">
            {data.nodes?.length || 0} nodes, {data.edges?.length || 0} edges
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Advanced network rendering coming soon
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (data.type) {
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'bar':
        return renderBarChart();
      case 'scatter':
        return renderScatterChart();
      case 'pie':
        return renderPieChart();
      case 'network':
        return renderNetworkChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <div className="w-full">
      {data.title && (
        <h3 className="text-lg font-medium mb-4 text-center">{data.title}</h3>
      )}
      <div style={{ width: '100%', height }}>
        {renderChart()}
      </div>
    </div>
  );
}