import React, { useState, useEffect } from 'react';
import {
  CalimeroApp,
  Context,
  ExecutionResponse,
} from '../../src/experimental/types';
import './ExecutionModal.css';

const METHODS = [
  { name: 'set', args: ['key', 'value'] },
  { name: 'entries', args: [] },
  { name: 'len', args: [] },
  { name: 'get', args: ['key'] },
  { name: 'get_unchecked', args: ['key'] },
  { name: 'get_result', args: ['key'] },
  { name: 'remove', args: ['key'] },
  { name: 'clear', args: [] },
];

interface ExecutionModalProps {
  app: CalimeroApp;
  context: Context;
  onClose: () => void;
  onExecute: (response: ExecutionResponse) => void;
}

const ExecutionModal: React.FC<ExecutionModalProps> = ({
  app,
  context,
  onClose,
  onExecute,
}) => {
  const [selectedMethod, setSelectedMethod] = useState(METHODS[0].name);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);

  const currentMethod = METHODS.find((m) => m.name === selectedMethod);

  useEffect(() => {
    // Reset args when method changes
    setArgs({});
  }, [selectedMethod]);

  const handleArgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArgs({
      ...args,
      [e.target.name]: e.target.value,
    });
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    const response = await app.execute(context, selectedMethod, args);
    onExecute(response);
    setIsExecuting(false);
    onClose();
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="overlay-content execution-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Execute method on context: {context.contextId}</h2>
        <div className="form-group">
          <label htmlFor="method-select">Method</label>
          <select
            id="method-select"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            {METHODS.map((method) => (
              <option key={method.name} value={method.name}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        {currentMethod?.args.map((argName) => (
          <div className="form-group" key={argName}>
            <label htmlFor={`arg-${argName}`}>{argName}</label>
            <input
              type="text"
              id={`arg-${argName}`}
              name={argName}
              value={args[argName] || ''}
              onChange={handleArgChange}
            />
          </div>
        ))}

        <div className="button-group">
          <button onClick={handleExecute} disabled={isExecuting}>
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
          <button onClick={onClose} disabled={isExecuting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionModal;
