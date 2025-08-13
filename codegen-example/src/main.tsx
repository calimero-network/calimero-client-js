import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AbiConformanceClient } from './generated/abi-conformance/index';
import {
  CalimeroProvider,
  useCalimero,
  CalimeroConnectButton,
} from '@calimero-network/calimero-client';

import './EventLog.css';

// Calimero app configuration
const calimeroConfig = {
  clientApplicationId: '9U3rBECcPFZCd844SiwAD4TC3sEdHHHdQppzqkwMVDmb',
  mode: 'multi-context' as any,
  applicationPath: '/',
};

interface TestResult {
  method: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

function App() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { app, isAuthenticated } = useCalimero();

  const runComprehensiveTests = async () => {
    if (!app || !isAuthenticated) {
      setResults([
        {
          method: 'connection',
          status: 'error',
          message: '❌ Not connected to Calimero. Please connect first.',
          details: { app: !!app, authenticated: isAuthenticated },
        },
      ]);
      return;
    }

    setIsRunning(true);
    setResults([]);

    // Create a context for the client
    const context = await app.createContext();
    const client = new AbiConformanceClient(app, context);

    const addResult = (result: TestResult) => {
      setResults((prev) => [...prev, result]);
    };

    const tests = [
      // 1. init
      {
        name: 'init',
        test: async () => {
          const result = await client.init();
          return {
            method: 'init',
            status: 'success' as const,
            message: '✅ init() - Returns AbiState with counters and users',
            details: {
              counters: (result as any).counters,
              userCount: (result as any).users.length,
            },
          };
        },
      },

      // 2. noop
      {
        name: 'noop',
        test: async () => {
          const result = await client.noop();
          return {
            method: 'noop',
            status: 'success' as const,
            message: '✅ noop() - Returns void/undefined',
            details: { result: result === undefined ? 'undefined' : result },
          };
        },
      },

      // 3. echo_bool
      {
        name: 'echoBool',
        test: async () => {
          const result = await client.echoBool({ b: true });
          return {
            method: 'echoBool',
            status: 'success' as const,
            message: '✅ echoBool() - Echoes boolean value',
            details: { input: true, output: result },
          };
        },
      },

      // 4. echo_i32
      {
        name: 'echoI32',
        test: async () => {
          const result = await client.echoI32({ v: -42 });
          return {
            method: 'echoI32',
            status: 'success' as const,
            message: '✅ echoI32() - Echoes 32-bit signed integer',
            details: { input: -42, output: result },
          };
        },
      },

      // 5. echo_i64
      {
        name: 'echoI64',
        test: async () => {
          const result = await client.echoI64({ v: -123456789 });
          return {
            method: 'echoI64',
            status: 'success' as const,
            message: '✅ echoI64() - Echoes 64-bit signed integer',
            details: { input: -123456789, output: result },
          };
        },
      },

      // 6. echo_u32
      {
        name: 'echoU32',
        test: async () => {
          const result = await client.echoU32({ v: 42 });
          return {
            method: 'echoU32',
            status: 'success' as const,
            message: '✅ echoU32() - Echoes 32-bit unsigned integer',
            details: { input: 42, output: result },
          };
        },
      },

      // 7. echo_u64
      {
        name: 'echoU64',
        test: async () => {
          const result = await client.echoU64({ v: 123456789 });
          return {
            method: 'echoU64',
            status: 'success' as const,
            message: '✅ echoU64() - Echoes 64-bit unsigned integer',
            details: { input: 123456789, output: result },
          };
        },
      },

      // 8. echo_f32
      {
        name: 'echoF32',
        test: async () => {
          const result = await client.echoF32({ v: 3.14159 });
          return {
            method: 'echoF32',
            status: 'success' as const,
            message: '✅ echoF32() - Echoes 32-bit float',
            details: { input: 3.14159, output: result },
          };
        },
      },

      // 9. echo_f64
      {
        name: 'echoF64',
        test: async () => {
          const result = await client.echoF64({ v: 2.718281828459045 });
          return {
            method: 'echoF64',
            status: 'success' as const,
            message: '✅ echoF64() - Echoes 64-bit float',
            details: { input: 2.718281828459045, output: result },
          };
        },
      },

      // 10. echo_string
      {
        name: 'echoString',
        test: async () => {
          const result = await client.echoString({ s: 'Hello, Calimero!' });
          return {
            method: 'echoString',
            status: 'success' as const,
            message: '✅ echoString() - Echoes string value',
            details: { input: 'Hello, Calimero!', output: result },
          };
        },
      },

      // 11. echo_bytes
      {
        name: 'echoBytes',
        test: async () => {
          const hexInput = '0102030405';
          const result = await client.echoBytes({ b: hexInput });
          return {
            method: 'echoBytes',
            status: 'success' as const,
            message: '✅ echoBytes() - Echoes hex string',
            details: { input: hexInput, output: result },
          };
        },
      },

      // 12. roundtrip_id
      {
        name: 'roundtripId',
        test: async () => {
          const userIdHex = '01'.repeat(32); // 32 bytes of 0x01
          const result = await client.roundtripId({ x: userIdHex });
          return {
            method: 'roundtripId',
            status: 'success' as const,
            message: '✅ roundtripId() - UserId32 roundtrip',
            details: { input: userIdHex, output: result },
          };
        },
      },

      // 13. roundtrip_hash
      {
        name: 'roundtripHash',
        test: async () => {
          const hashHex = '02'.repeat(64); // 64 bytes of 0x02
          const result = await client.roundtripHash({ h: hashHex });
          return {
            method: 'roundtripHash',
            status: 'success' as const,
            message: '✅ roundtripHash() - Hash64 roundtrip',
            details: { input: hashHex, output: result },
          };
        },
      },
    ];

    // Run all tests
    for (const test of tests) {
      try {
        const result = await test.test();
        addResult(result);
      } catch (error) {
        addResult({
          method: test.name,
          status: 'error',
          message: `❌ ${test.name}() - Failed with error`,
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  const copyErrors = () => {
    const errors = results.filter((r) => r.status === 'error');
    if (errors.length === 0) return;

    const errorText = errors
      .map(
        (error) =>
          `${error.method}: ${error.message}\n${error.details ? JSON.stringify(error.details, null, 2) : ''}`,
      )
      .join('\n\n');

    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        alert(`Copied ${errors.length} error(s) to clipboard!`);
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = errorText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Copied ${errors.length} error(s) to clipboard!`);
      });
  };

  const passedCount = results.filter((r) => r.status === 'success').length;
  const totalCount = results.length;
  const errorCount = totalCount - passedCount;

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔬 ABI Conformance Test Suite</h1>
        <p>
          Comprehensive testing of the abi-conformance client with real Calimero
          app
        </p>

        <div className="connection-status">
          <CalimeroConnectButton />
          {isAuthenticated ? (
            <span className="status connected">✅ Connected to Calimero</span>
          ) : (
            <span className="status disconnected">❌ Not connected</span>
          )}
        </div>

        <div className="test-controls">
          <button
            onClick={runComprehensiveTests}
            disabled={isRunning || !isAuthenticated}
            className="test-button"
          >
            {isRunning ? '🧪 Running Tests...' : '🚀 Run All Tests'}
          </button>

          <button
            onClick={clearResults}
            disabled={isRunning || results.length === 0}
            className="clear-button"
          >
            🗑️ Clear Results
          </button>

          <button
            onClick={copyErrors}
            disabled={isRunning || errorCount === 0}
            className="copy-errors-button"
          >
            📋 Copy Errors ({errorCount})
          </button>
        </div>

        {totalCount > 0 && (
          <div className="test-summary">
            <h3>📊 Test Summary</h3>
            <div className="summary-stats">
              <span className="stat passed">✅ Passed: {passedCount}</span>
              <span className="stat failed">❌ Failed: {errorCount}</span>
              <span className="stat total">📈 Total: {totalCount}</span>
              <span className="stat rate">
                🎯 Success Rate:{' '}
                {totalCount > 0
                  ? ((passedCount / totalCount) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="test-results">
        {results.length > 0 && (
          <div className="results-container">
            <h3>📋 Test Results</h3>
            <div className="results-list">
              {results.map((result, index) => (
                <div key={index} className={`result-item ${result.status}`}>
                  <div className="result-header">
                    <span className="method-name">{result.method}</span>
                    <span className="result-status">
                      {result.status === 'success' ? '✅' : '❌'}
                    </span>
                  </div>
                  <div className="result-message">{result.message}</div>
                  {result.details && (
                    <div className="result-details">
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CalimeroProvider {...calimeroConfig}>
      <App />
    </CalimeroProvider>
  </React.StrictMode>,
);
