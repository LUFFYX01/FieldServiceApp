import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface ApiHealthStatus {
  isHealthy: boolean;
  message: string;
  lastChecked: Date | null;
}

export function useApiHealthCheck(interval: number = 30000) {
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus>({
    isHealthy: true,
    message: 'Checking...',
    lastChecked: null,
  });

  const checkHealth = async () => {
    try {
      await apiRequest(API_ENDPOINTS.HEALTH);
      setHealthStatus({
        isHealthy: true,
        message: 'Backend connected',
        lastChecked: new Date(),
      });
    } catch (error) {
      setHealthStatus({
        isHealthy: false,
        message: 'Backend disconnected',
        lastChecked: new Date(),
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const intervalId = setInterval(checkHealth, interval);
    return () => clearInterval(intervalId);
  }, [interval]);

  return { healthStatus, checkHealth };
}

function ApiHealthIndicator() {
  const { healthStatus } = useApiHealthCheck();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: healthStatus.isHealthy ? '#2d5a27' : '#8b2942',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: healthStatus.isHealthy ? '#2d5a27' : '#8b2942',
          animation: healthStatus.isHealthy ? 'pulse 2s infinite' : 'none',
        }}
      />
      <span>{healthStatus.message}</span>
      {healthStatus.lastChecked && (
        <span style={{ color: '#808080', marginLeft: '0.25rem' }}>
          ({healthStatus.lastChecked.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
}

export default ApiHealthIndicator;