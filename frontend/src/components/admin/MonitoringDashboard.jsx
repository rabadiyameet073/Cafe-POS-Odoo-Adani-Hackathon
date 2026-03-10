/**
 * MonitoringDashboard Component
 * 
 * Displays system health metrics, payment statistics, and alerts.
 * 
 * Requirements: Reliability NFR 1
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MonitoringDashboard.css';
import Icon from '../Icons'

const API_URL = import.meta.env.VITE_API_URL || '/api';

function MonitoringDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [paymentStats, setPaymentStats] = useState(null);
    const [timerAccuracy, setTimerAccuracy] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('24h');
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        fetchAllData();

        // Auto-refresh every 30 seconds
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchAllData, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, timeRange]);

    const fetchAllData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [metricsRes, paymentsRes, timersRes, alertsRes] = await Promise.all([
                axios.get(`${API_URL}/api/monitoring/metrics`, { headers }),
                axios.get(`${API_URL}/api/monitoring/payments?timeRange=${timeRange}`, { headers }),
                axios.get(`${API_URL}/api/monitoring/timers`, { headers }),
                axios.get(`${API_URL}/api/monitoring/alerts?limit=10`, { headers })
            ]);

            setMetrics(metricsRes.data.data);
            setPaymentStats(paymentsRes.data.data);
            setTimerAccuracy(timersRes.data.data);
            setAlerts(alertsRes.data.data.alerts || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching monitoring data:', err);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'status-healthy';
            case 'degraded':
                return 'status-degraded';
            case 'error':
                return 'status-error';
            default:
                return '';
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical':
                return 'severity-critical';
            case 'warning':
                return 'severity-warning';
            case 'info':
                return 'severity-info';
            default:
                return '';
        }
    };

    if (loading) {
        return <div className="monitoring-dashboard loading">Loading monitoring data...</div>;
    }

    return (
        <div className="monitoring-dashboard">
            <div className="dashboard-header">
                <h2>System Monitoring Dashboard</h2>
                <div className="header-controls">
                    <label>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh (30s)
                    </label>
                    <button onClick={fetchAllData} className="btn-refresh">
                        <Icon name="refresh" className="w-5 h-5 inline" /> Refresh Now
                    </button>
                </div>
            </div>

            {/* System Health */}
            <div className="metrics-section">
                <h3>System Health</h3>
                <div className={`health-status ${getStatusColor(metrics?.status)}`}>
                    <span className="status-indicator"></span>
                    <span className="status-text">{metrics?.status?.toUpperCase()}</span>
                    <span className="status-time">
                        Last updated: {new Date(metrics?.timestamp).toLocaleTimeString()}
                    </span>
                </div>

                <div className="metrics-grid">
                    {/* Request Metrics */}
                    <div className="metric-card">
                        <h4>API Requests</h4>
                        <div className="metric-value">{metrics?.metrics.requests.total}</div>
                        <div className="metric-details">
                            <div><Icon name="checkCircle" className="w-4 h-4 inline" /> Success: {metrics?.metrics.requests.success}</div>
                            <div><Icon name="xCircle" className="w-4 h-4 inline" /> Errors: {metrics?.metrics.requests.errors}</div>
                            <div className={metrics?.metrics.requests.errorRate > '10%' ? 'metric-warning' : ''}>
                                Error Rate: {metrics?.metrics.requests.errorRate}
                            </div>
                        </div>
                    </div>

                    {/* Database Status */}
                    <div className="metric-card">
                        <h4>Database</h4>
                        <div className={`metric-value ${metrics?.metrics.database.connected ? 'text-success' : 'text-error'}`}>
                            {metrics?.metrics.database.status}
                        </div>
                        <div className="metric-details">
                            {metrics?.metrics.database.connected ? '<Icon name="checkCircle" className="w-4 h-4 inline" /> Connected' : '<Icon name="xCircle" className="w-4 h-4 inline" /> Disconnected'}
                        </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="metric-card">
                        <h4>Real-time Connections</h4>
                        <div className="metric-value">{metrics?.metrics.subscriptions.activeConnections}</div>
                        <div className="metric-details">
                            Active subscription connections
                        </div>
                    </div>

                    {/* Active Timers */}
                    <div className="metric-card">
                        <h4>Active Timers</h4>
                        <div className="metric-value">{metrics?.metrics.timers.active}</div>
                        <div className="metric-details">
                            Tables with running timers
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Statistics */}
            <div className="metrics-section">
                <h3>
                    Payment Statistics
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="time-range-select"
                    >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </select>
                </h3>

                <div className="metrics-grid">
                    <div className="metric-card">
                        <h4>Total Payments</h4>
                        <div className="metric-value">{paymentStats?.stats.total}</div>
                        <div className="metric-details">
                            ₹{paymentStats?.stats.totalAmount.toFixed(2)}
                        </div>
                    </div>

                    <div className="metric-card">
                        <h4>Success Rate</h4>
                        <div className={`metric-value ${parseFloat(paymentStats?.stats.successRate) < 80 ? 'text-warning' : 'text-success'}`}>
                            {paymentStats?.stats.successRate}%
                        </div>
                        <div className="metric-details">
                            Successful transactions
                        </div>
                    </div>

                    <div className="metric-card">
                        <h4>By Method</h4>
                        <div className="metric-details">
                            <div><Icon name="cash" className="w-5 h-5 inline" /> Cash: {paymentStats?.stats.byMethod.cash || 0}</div>
                            <div><Icon name="phone" className="w-5 h-5 inline" /> UPI: {paymentStats?.stats.byMethod.upi || 0}</div>
                        </div>
                    </div>

                    <div className="metric-card">
                        <h4>By Status</h4>
                        <div className="metric-details">
                            <div><Icon name="checkCircle" className="w-4 h-4 inline" /> Approved: {paymentStats?.stats.byStatus.approved || 0}</div>
                            <div><Icon name="checkCircle" className="w-4 h-4 inline" /> Completed: {paymentStats?.stats.byStatus.completed || 0}</div>
                            <div><Icon name="xCircle" className="w-4 h-4 inline" /> Failed: {paymentStats?.stats.byStatus.failed || 0}</div>
                            <div><Icon name="xCircle" className="w-4 h-4 inline" /> Rejected: {paymentStats?.stats.byStatus.rejected || 0}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timer Accuracy */}
            <div className="metrics-section">
                <h3>Timer Accuracy (Last 24h)</h3>
                <div className="metrics-grid">
                    <div className="metric-card">
                        <h4>Sessions Analyzed</h4>
                        <div className="metric-value">{timerAccuracy?.sessionsAnalyzed}</div>
                    </div>

                    <div className="metric-card">
                        <h4>Expired Sessions</h4>
                        <div className="metric-value">{timerAccuracy?.expiredSessions}</div>
                    </div>

                    <div className="metric-card">
                        <h4>Average Deviation</h4>
                        <div className="metric-value">{timerAccuracy?.averageDeviationSeconds}s</div>
                    </div>

                    <div className="metric-card">
                        <h4>Accuracy</h4>
                        <div className="metric-value text-success">{timerAccuracy?.accuracy}</div>
                    </div>
                </div>
            </div>

            {/* Recent Alerts */}
            <div className="metrics-section">
                <h3>Recent Alerts</h3>
                {alerts.length === 0 ? (
                    <div className="no-alerts"><Icon name="checkCircle" className="w-4 h-4 inline" /> No recent alerts - system is healthy</div>
                ) : (
                    <div className="alerts-list">
                        {alerts.map((alert, index) => (
                            <div key={index} className={`alert-item ${getSeverityColor(alert.data?.severity)}`}>
                                <div className="alert-header">
                                    <span className="alert-title">{alert.title}</span>
                                    <span className="alert-time">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="alert-body">{alert.body}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MonitoringDashboard;
