import React, { useState, useEffect } from 'react';
import { ExtensionUiRequest, ExtensionUiResponse } from '../../types/pi';
import { Check, X, HelpCircle, List, Edit2 } from 'lucide-react';

interface UiBridgeModalProps {
  request: ExtensionUiRequest | null;
  onResolve: (res: ExtensionUiResponse) => void;
}

export const UiBridgeModal: React.FC<UiBridgeModalProps> = ({ request, onResolve }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    if (request) {
      if (request.method === 'input') {
        setInputValue(request.placeholder || '');
      } else if (request.method === 'editor') {
        setInputValue(request.prefill || '');
      } else if (request.method === 'select' && request.options && request.options.length > 0) {
        setSelectedOption(request.options[0]);
      }
    }
  }, [request]);

  if (!request) return null;

  const handleCancel = () => {
    onResolve({
      type: 'extension_ui_response',
      id: request.id,
      cancelled: true
    });
  };

  const handleConfirm = (val: boolean) => {
    onResolve({
      type: 'extension_ui_response',
      id: request.id,
      confirmed: val
    });
  };

  const handleValueSubmit = (val: string) => {
    onResolve({
      type: 'extension_ui_response',
      id: request.id,
      value: val
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-dark-100 text-sm">
            {request.method === 'select' && <List size={16} className="text-blue-400" />}
            {request.method === 'confirm' && <HelpCircle size={16} className="text-amber-400" />}
            {request.method === 'input' && <Edit2 size={16} className="text-emerald-400" />}
            {request.method === 'editor' && <Edit2 size={16} className="text-purple-400" />}
            <span>{request.title || 'Agent Request'}</span>
          </div>

          <button onClick={handleCancel} className="text-dark-400 hover:text-dark-200">
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-sm text-dark-200">
          {request.message && (
            <p className="text-dark-300 leading-relaxed whitespace-pre-wrap">{request.message}</p>
          )}

          {/* Select Component */}
          {request.method === 'select' && request.options && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {request.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition text-xs font-mono flex items-center justify-between ${selectedOption === opt ? 'bg-pi-accent/15 border-pi-accent/50 text-white font-medium' : 'bg-dark-800/60 border-dark-750 text-dark-300 hover:bg-dark-800'}`}
                >
                  <span>{opt}</span>
                  {selectedOption === opt && <Check size={14} className="text-pi-accent" />}
                </button>
              ))}
            </div>
          )}

          {/* Input Component */}
          {request.method === 'input' && (
            <div>
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleValueSubmit(inputValue);
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder={request.placeholder || 'Enter value...'}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-100 outline-none focus:border-pi-accent"
              />
            </div>
          )}

          {/* Editor Component */}
          {request.method === 'editor' && (
            <div>
              <textarea
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={8}
                className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 text-xs font-mono text-dark-100 outline-none focus:border-pi-accent leading-relaxed resize-y"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-dark-950/60 border-t border-dark-800 flex justify-end gap-2 text-xs font-medium">
          <button
            onClick={handleCancel}
            className="px-3.5 py-1.5 rounded-lg border border-dark-700 hover:bg-dark-800 text-dark-300 transition"
          >
            Cancel
          </button>

          {request.method === 'confirm' && (
            <>
              <button
                onClick={() => handleConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-dark-700 hover:bg-dark-800 text-dark-300 transition"
              >
                No
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="px-4 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white transition"
              >
                Yes, Continue
              </button>
            </>
          )}

          {request.method === 'select' && (
            <button
              onClick={() => handleValueSubmit(selectedOption)}
              className="px-4 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white transition"
            >
              Select
            </button>
          )}

          {(request.method === 'input' || request.method === 'editor') && (
            <button
              onClick={() => handleValueSubmit(inputValue)}
              className="px-4 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white transition"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
