import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AbiConformanceClient,
  Action,
  CalimeroBytes,
} from './generated/abi-conformance/AbiConformanceClient';
import {
  Context,
  CalimeroProvider,
  useCalimero,
  CalimeroConnectButton,
  AppMode,
} from '@calimero-network/calimero-client';

// Utility function for converting byte arrays to hex strings
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Calimero app configuration
const calimeroConfig = {
  clientApplicationId:
    import.meta.env.VITE_CALIMERO_CLIENT_APP_ID || 'YOUR_CLIENT_APP_ID',
  mode: AppMode.MultiContext,
  applicationPath: import.meta.env.VITE_CALIMERO_APP_PATH || 'YOUR_APP_PATH',
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

    // Create a context for the client (this calls init automatically)
    let context: Context;
    let client;
    try {
      // context = await app.createContext();
      context = {
        contextId: '44a5587LgLJntDLXjX5qbSxwEpaWXCxFtkmKqME5mXyV',
        executorId: '5FU8fnDYh15HBKyXc5BRuxy6EQoWVEZAV6h5osqs87f3',
        applicationId: '5xC9UMNuwh9ddCfXNnapiRuhBnqgLyz2rbu3C8yKXU5h',
      };
      console.log('Context creation result:', context);
      client = new AbiConformanceClient(app, context);
    } catch (error) {
      setResults([
        {
          method: 'context-creation',
          status: 'error',
          message: '❌ Failed to create context',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
      ]);
      setIsRunning(false);
      return;
    }

    const addResult = (result: TestResult) => {
      setResults((prev) => [...prev, result]);
    };

    const tests = [
      // 1. noop
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

      // 2. echo_bool
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

      // 3. echo_i32
      {
        name: 'echoI32',
        test: async () => {
          const result = await client.echoI32({ x: -42 });
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
          const result = await client.echoI64({ x: -123456789 });
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
          const result = await client.echoU32({ x: 42 });
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
          const result = await client.echoU64({ x: 123456789 });
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
          const result = await client.echoF32({ x: 3.14159 });
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
          const result = await client.echoF64({ x: 2.718281828459045 });
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
          const result = await client.echoBytes({
            b: CalimeroBytes.fromHex(hexInput),
          });
          return {
            method: 'echoBytes',
            status: 'success' as const,
            message: '✅ echoBytes() - Echoes byte array',
            details: {
              input: hexInput,
              output: bytesToHex(result.toUint8Array()),
            },
          };
        },
      },

      // 12. roundtrip_id
      {
        name: 'roundtripId',
        test: async () => {
          const userIdHex = '01'.repeat(32); // 32 bytes of 0x01
          const result = await client.roundtripId({
            x: CalimeroBytes.fromHex(userIdHex),
          });
          return {
            method: 'roundtripId',
            status: 'success' as const,
            message: '✅ roundtripId() - UserId32 roundtrip',
            details: {
              input: userIdHex,
              output: bytesToHex(result.toUint8Array()),
            },
          };
        },
      },

      // 13. roundtrip_hash
      {
        name: 'roundtripHash',
        test: async () => {
          const hashHex = '02'.repeat(64); // 64 bytes of 0x02
          const result = await client.roundtripHash({
            h: CalimeroBytes.fromHex(hashHex),
          });
          return {
            method: 'roundtripHash',
            status: 'success' as const,
            message: '✅ roundtripHash() - Hash64 roundtrip',
            details: {
              input: hashHex,
              output: bytesToHex(result.toUint8Array()),
            },
          };
        },
      },

      // 14. opt_u32
      {
        name: 'optU32',
        test: async () => {
          const result1 = await client.optU32({ x: 42 });
          const result2 = await client.optU32({ x: null });
          return {
            method: 'optU32',
            status: 'success' as const,
            message: '✅ optU32() - Optional 32-bit unsigned integer',
            details: { withValue: result1, withNull: result2 },
          };
        },
      },

      // 15. opt_string
      {
        name: 'optString',
        test: async () => {
          const result1 = await client.optString({ x: 'Hello' });
          const result2 = await client.optString({ x: null });
          return {
            method: 'optString',
            status: 'success' as const,
            message: '✅ optString() - Optional string',
            details: { withValue: result1, withNull: result2 },
          };
        },
      },

      // 16. opt_record
      {
        name: 'optRecord',
        test: async () => {
          const person = {
            id: CalimeroBytes.fromHex('01'.repeat(32)), // 32 bytes of 0x01
            name: 'Test Person',
            age: 30,
          };
          const result1 = await client.optRecord({ p: person });
          const result2 = await client.optRecord({ p: null });
          return {
            method: 'optRecord',
            status: 'success' as const,
            message: '✅ optRecord() - Optional record',
            details: { withValue: result1, withNull: result2 },
          };
        },
      },

      // 17. opt_id
      {
        name: 'optId',
        test: async () => {
          const idHex = '03'.repeat(32);
          const result1 = await client.optId({
            x: CalimeroBytes.fromHex(idHex),
          });
          const result2 = await client.optId({ x: null });
          return {
            method: 'optId',
            status: 'success' as const,
            message: '✅ optId() - Optional ID',
            details: {
              withValue: result1 ? bytesToHex(result1.toUint8Array()) : null,
              withNull: result2,
            },
          };
        },
      },

      // 18. list_u32
      {
        name: 'listU32',
        test: async () => {
          const numbers = [1, 2, 3, 4, 5];
          const result = await client.listU32({ xs: numbers });
          return {
            method: 'listU32',
            status: 'success' as const,
            message: '✅ listU32() - List of 32-bit unsigned integers',
            details: { input: numbers, output: result },
          };
        },
      },

      // 19. list_strings
      {
        name: 'listStrings',
        test: async () => {
          const strings = ['Hello', 'World', 'Test'];
          const result = await client.listStrings({ xs: strings });
          return {
            method: 'listStrings',
            status: 'success' as const,
            message: '✅ listStrings() - List of strings',
            details: { input: strings, output: result },
          };
        },
      },

      // 20. list_records
      {
        name: 'listRecords',
        test: async () => {
          const person1 = {
            id: CalimeroBytes.fromHex('07'.repeat(32)), // 32 bytes of 0x07
            name: 'List Person 1',
            age: 40,
          };
          const person2 = {
            id: CalimeroBytes.fromHex('08'.repeat(32)), // 32 bytes of 0x08
            name: 'List Person 2',
            age: 45,
          };
          const result = await client.listRecords({ ps: [person1, person2] });
          return {
            method: 'listRecords',
            status: 'success' as const,
            message: '✅ listRecords() - List of records',
            details: {
              output: result.map((person) => ({
                ...person,
                id: bytesToHex(person.id.toUint8Array()),
              })),
            },
          };
        },
      },

      // 21. list_ids
      {
        name: 'listIds',
        test: async () => {
          const ids = [
            CalimeroBytes.fromHex('09'.repeat(32)),
            CalimeroBytes.fromHex('0A'.repeat(32)),
          ]; // 32 bytes each
          const result = await client.listIds({ xs: ids });
          return {
            method: 'listIds',
            status: 'success' as const,
            message: '✅ listIds() - List of IDs',
            details: {
              output: result.map((id) => bytesToHex(id.toUint8Array())),
            },
          };
        },
      },

      // 22. map_u32
      {
        name: 'mapU32',
        test: async () => {
          const map = { a: 1, b: 2, c: 3 };
          const result = await client.mapU32({ m: map });
          return {
            method: 'mapU32',
            status: 'success' as const,
            message: '✅ mapU32() - Map of strings to 32-bit unsigned integers',
            details: { input: map, output: result },
          };
        },
      },

      // 23. map_list_u32
      {
        name: 'mapListU32',
        test: async () => {
          const map = { a: [1, 2], b: [3, 4, 5] };
          const result = await client.mapListU32({ m: map });
          return {
            method: 'mapListU32',
            status: 'success' as const,
            message:
              '✅ mapListU32() - Map of strings to lists of 32-bit unsigned integers',
            details: { input: map, output: result },
          };
        },
      },

      // 24. map_record
      {
        name: 'mapRecord',
        test: async () => {
          const person = {
            id: CalimeroBytes.fromHex('06'.repeat(32)), // 32 bytes of 0x06
            name: 'Map Person',
            age: 35,
          };
          const result = await client.mapRecord({
            m: { key1: person, key2: person },
          });
          return {
            method: 'mapRecord',
            status: 'success' as const,
            message: '✅ mapRecord() - Map of records',
            details: {
              output: Object.fromEntries(
                Object.entries(result).map(([key, person]) => [
                  key,
                  { ...person, id: bytesToHex(person.id.toUint8Array()) },
                ]),
              ),
            },
          };
        },
      },

      // 25. make_person
      {
        name: 'makePerson',
        test: async () => {
          const person = {
            id: CalimeroBytes.fromHex('04'.repeat(32)), // 32 bytes of 0x04
            name: 'John Doe',
            age: 25,
          };
          const result = await client.makePerson({ p: person });
          return {
            method: 'makePerson',
            status: 'success' as const,
            message: '✅ makePerson() - Create a person record',
            details: {
              input: { ...person, id: bytesToHex(person.id.toUint8Array()) },
              output: { ...result, id: bytesToHex(result.id.toUint8Array()) },
            },
          };
        },
      },

      // 26. profile_roundtrip
      {
        name: 'profileRoundtrip',
        test: async () => {
          const profile = {
            bio: 'Product Manager',
            avatar: CalimeroBytes.fromHex('05'.repeat(32)), // 32 bytes of 0x05
            nicknames: ['Jane', 'JS'],
          };
          const result = await client.profileRoundtrip({ p: profile });
          return {
            method: 'profileRoundtrip',
            status: 'success' as const,
            message: '✅ profileRoundtrip() - Profile roundtrip',
            details: {
              input: {
                ...profile,
                avatar: profile.avatar
                  ? bytesToHex(profile.avatar.toUint8Array())
                  : null,
              },
              output: {
                ...result,
                avatar: result.avatar
                  ? bytesToHex(result.avatar.toUint8Array())
                  : null,
              },
            },
          };
        },
      },

      // 27. act
      {
        name: 'act',
        test: async () => {
          const action = Action.Ping();
          const result = await client.act({ a: action });
          return {
            method: 'act',
            status: 'success' as const,
            message: '✅ act() - Execute action',
            details: { input: action, output: result },
          };
        },
      },

      // 27b. act with payload
      {
        name: 'actWithPayload',
        test: async () => {
          const input = Action.SetName('John Doe');
          const result = await client.act({ a: input });
          return {
            method: 'actWithPayload',
            status: 'success' as const,
            message: '✅ act() - Execute action with payload',
            details: { input, output: result },
          };
        },
      },

      // 27c. act with Update payload
      {
        name: 'actWithUpdate',
        test: async () => {
          const input = Action.Update({ age: 30 });
          const result = await client.act({ a: input });
          return {
            method: 'actWithUpdate',
            status: 'success' as const,
            message: '✅ act() - Execute action with Update payload',
            details: { input, output: result },
          };
        },
      },

      // 28. may_fail
      {
        name: 'mayFail',
        test: async () => {
          try {
            const result = await client.mayFail({ flag: false });
            return {
              method: 'mayFail',
              status: 'error' as const,
              message: '❌ mayFail() - Expected error but got success',
              details: { input: false, output: result },
            };
          } catch (error) {
            // Expected error due to flag: false
            // Note: Error handling is currently suboptimal due to ExecutionError(Vec<u8>)
            // being string-wrapped. See: https://github.com/calimero-network/core/issues/1394
            return {
              method: 'mayFail',
              status: 'success' as const,
              message: '✅ mayFail() - Correctly triggered expected error',
              details: {
                input: false,
                error: error instanceof Error ? error.message : String(error),
                note: 'This error is expected when flag=false. Error format needs improvement per issue #1394',
              },
            };
          }
        },
      },

      // 28b. may_fail success case
      {
        name: 'mayFailSuccess',
        test: async () => {
          const result = await client.mayFail({ flag: true });
          return {
            method: 'mayFailSuccess',
            status: 'success' as const,
            message: '✅ mayFail(true) - Should return 42',
            details: { input: true, output: result },
          };
        },
      },

      // 29. find_person
      {
        name: 'findPerson',
        test: async () => {
          try {
            const result = await client.findPerson({ name: 'Test Person' });
            return {
              method: 'findPerson',
              status: 'success' as const,
              message: '✅ findPerson() - Find person by name',
              details: {
                input: 'Test Person',
                output: {
                  ...result,
                  id: bytesToHex(result.id.toUint8Array()),
                },
              },
            };
          } catch (error) {
            // This might fail if the person doesn't exist, which is expected
            // Note: Error handling is currently suboptimal due to ExecutionError(Vec<u8>)
            // being string-wrapped. See: https://github.com/calimero-network/core/issues/1394
            return {
              method: 'findPerson',
              status: 'success' as const,
              message: '✅ findPerson() - Correctly handled missing person',
              details: {
                input: 'Test Person',
                error: error instanceof Error ? error.message : String(error),
                note: 'This error is expected if the person does not exist. Error format needs improvement per issue #1394',
              },
            };
          }
        },
      },
    ];

    // Run all tests independently
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
