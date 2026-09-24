import React from 'react';
import { Printer, Utensils } from 'lucide-react';
import { BusinessConfig } from '../types';

interface PrintLayoutProps {
  title: string;
  subtitle: string;
  config: BusinessConfig;
  onClose: () => void;
  children: React.ReactNode;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ title, subtitle, config, onClose, children }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-50/90 backdrop-blur-sm overflow-y-auto print:bg-white print:static print:z-0">
      <style>{`
        @media print {
          body { visibility: hidden; background: white; margin: 0; padding: 0; }
          .print-container { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {/* Top Bar for UI (Hidden in Print) */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div>
          <h2 className="font-bold text-gray-800">Vista Previa de Impresión</h2>
          <p className="text-xs text-gray-500">Revisa el formato antes de mandar a imprimir o guardar como PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors">
            Cancelar
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
            <Printer className="w-4 h-4" />
            Confirmar Impresión
          </button>
        </div>
      </div>

      {/* Paper Sheet */}
      <div className="p-8 flex justify-center print:p-0 print:block animate-fade-in">
        <div className="print-container bg-white shadow-2xl print:shadow-none w-full max-w-[850px] min-h-[1100px] p-12 print:p-4 rounded-xl print:rounded-none mx-auto border border-gray-200 print:border-none">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-amber-500 pb-6 mb-8">
            <div className="flex items-center gap-4">
              {config.brandLogo ? (
                <img src={config.brandLogo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover shadow-sm print:border print:border-amber-200" />
              ) : (
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-sm print:border print:border-amber-200">
                  <Utensils className="text-white w-8 h-8 print:text-amber-600" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-serif font-bold text-amber-950">{config.businessName || 'Desayunos Cony'}</h1>
                <p className="text-sm text-gray-600 font-medium mt-1">{config.slogan || 'El auténtico sabor de casa'}</p>
                {config.address && <p className="text-[10px] text-gray-500 mt-0.5">{config.address}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">Reportes del Sistema Administrativo</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
              <p className="text-sm text-amber-600 font-bold mt-1">{subtitle}</p>
              <p className="text-[10px] text-gray-500 mt-2">
                Generado: {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="print-content text-gray-800 min-h-[500px]">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
              Documento oficial • {config.businessName || 'Sistema de Gestión Cony'} • Uso Exclusivo Interno
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
