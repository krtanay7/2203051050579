
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  event: string;
  data?: any;
  userAgent: string;
  url: string;
}

interface LoggingContextType {
  logs: LogEntry[];
  log: (level: LogLevel, event: string, data?: any) => void;
  clearLogs: () => void;
  exportLogs: () => string;
  getLogsByLevel: (level: LogLevel) => LogEntry[];
}

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);

export const useLogging = () => {
  const context = useContext(LoggingContext);
  if (!context) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  return context;
};

export const LoggingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = (level: LogLevel, event: string, data?: any): void => {
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      event,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    setLogs(prev => [logEntry, ...prev].slice(0, 1000)); // Keep only last 1000 logs
    
    // Also log to browser console
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}] ${event}`, data || '');
  };

  const clearLogs = (): void => {
    setLogs([]);
    log('info', 'Logs cleared');
  };

  const exportLogs = (): string => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        event: log.event,
        data: log.data,
        url: log.url,
      })),
    };
    
    log('info', 'Logs exported', { logCount: logs.length });
    return JSON.stringify(exportData, null, 2);
  };

  const getLogsByLevel = (level: LogLevel): LogEntry[] => {
    return logs.filter(log => log.level === level);
  };

  return (
    <LoggingContext.Provider value={{
      logs,
      log,
      clearLogs,
      exportLogs,
      getLogsByLevel,
    }}>
      {children}
    </LoggingContext.Provider>
  );
};
