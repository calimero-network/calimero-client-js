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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Execute method on context: {context.contextId}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
        <div className="form-group">
          <label htmlFor="method-select">Method</label>
          <select
            id="method-select"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }}
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
          <button 
            className="execute-button" 
            onClick={handleExecute} 
            disabled={isExecuting}
          >
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
          <button 
            className="cancel-button" 
            onClick={onClose} 
            disabled={isExecuting}
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionModal;
