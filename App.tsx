import React from 'react';
import { Calculator } from './components/Calculator';
import { Calculator as CalculatorIcon } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
              <CalculatorIcon size={28} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase tracking-tight">
            Khái Toán Chi Phí Xây Dựng
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-sm">
            Công cụ ước tính chi phí xây dựng nhà ở dân dụng tại Việt Nam.
          </p>
        </header>

        <main>
          <Calculator />
        </main>

        <footer className="mt-12 text-center text-sm text-gray-400 pb-8">
          <p>&copy; {new Date().getFullYear()} VN Construction Estimator. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;