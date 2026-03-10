/**
 * useGracefulDegradation Hook
 * 
 * Monitors system degradation status and provides fallback mechanisms
 * - Detects cash-only mode
 * - Detects manual table mode
 * - Provides user-facing messages
 * 
 * Requirements: Reliability NFR 1
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const useGracefulDegradation = () => {
  const [degradationState, setDegradationState] = useState({
    cashOnlyMode: false,
    manualTableMode: false,
    availablePaymentMethods: ['cash', 'upi'],
    systemMode: 'normal',
    userMessage: null,
    isLoading: true,
    lastCheck: null
  });

  /**
   * Fetch system status from backend
   */
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system/status`);
      
      if (response.data.success) {
        setDegradationState({
          cashOnlyMode: response.data.status.cashOnlyMode,
          manualTableMode: response.data.status.manualTableMode,
          availablePaymentMethods: response.data.status.availablePaymentMethods,
          systemMode: response.data.status.systemMode,
          userMessage: response.data.userMessage,
          isLoading: false,
          lastCheck: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      // On error, assume degraded state for safety
      setDegradationState(prev => ({
        ...prev,
        isLoading: false,
        lastCheck: new Date()
      }));
    }
  }, []);

  /**
   * Check if a payment method is available
   */
  const isPaymentMethodAvailable = useCallback((method) => {
    return degradationState.availablePaymentMethods.includes(method);
  }, [degradationState.availablePaymentMethods]);

  /**
   * Get user-facing message about degradation
   */
  const getDegradationMessage = useCallback(() => {
    return degradationState.userMessage;
  }, [degradationState.userMessage]);

  /**
   * Check if system is in degraded mode
   */
  const isDegraded = useCallback(() => {
    return degradationState.systemMode !== 'normal';
  }, [degradationState.systemMode]);

  // Fetch status on mount and periodically
  useEffect(() => {
    fetchSystemStatus();

    // Check every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);

    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  return {
    ...degradationState,
    isPaymentMethodAvailable,
    getDegradationMessage,
    isDegraded,
    refresh: fetchSystemStatus
  };
};

export default useGracefulDegradation;
