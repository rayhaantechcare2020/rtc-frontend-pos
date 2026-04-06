import React from 'react';
import { Link } from 'react-router-dom';
import { FiBarChart2, FiTrendingUp, FiPieChart, FiCalendar } from 'react-icons/fi';
import { saleService } from '../../services/sale';
import {reportService} from '../../services/reportService';

// Top Products
const fetchTopProducts = async () => {
  const response = await reportService.getTopProducts({ limit: 10 });
  setProducts(response.data);
};

// Daily Sales
const fetchDailySales = async () => {
  const response = await reportService.getDailySales(selectedDate);
  setSalesData(response.data);
};

// Profit & Loss
const fetchProfitLoss = async () => {
  const response = await reportService.getProfitLoss(fromDate, toDate);
  setReportData(response.data);
};

const Reports = () => {
  const reportCards = [
    { title: 'Daily Sales', icon: FiCalendar, path: '/reports/daily', color: 'bg-blue-600' },
    { title: 'Top Products', icon: FiTrendingUp, path: '/reports/top-products', color: 'bg-green-600' },
    { title: 'Profit & Loss', icon: FiBarChart2, path: '/reports/profit-loss', color: 'bg-purple-600' },
    { title: 'Sales Summary', icon: FiPieChart, path: '/reports/sales', color: 'bg-orange-600' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((report) => (
          <Link
            key={report.path}
            to={report.path}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition"
          >
            <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <report.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold">{report.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">View report →</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reports;