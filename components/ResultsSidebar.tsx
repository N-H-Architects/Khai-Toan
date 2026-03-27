import React from 'react';
import { CalculationResult } from '../types';
import { formatCurrency } from '../utils/format';
import { Printer } from 'lucide-react';

interface ResultsSidebarProps {
  result: CalculationResult;
}

export const ResultsSidebar: React.FC<ResultsSidebarProps> = ({ result }) => {
  const hasData = result.grandTotal > 0;
  const { usePackagePrice } = result;

  return (
    <div className="bg-slate-800 text-white rounded-xl shadow-xl overflow-hidden sticky top-6">
      <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold uppercase tracking-wider text-sm">Báo Cáo Khái Toán</h3>
        <button 
          onClick={() => window.print()}
          className="text-slate-400 hover:text-white transition-colors"
          title="Print"
        >
          <Printer size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {!hasData ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            <p>Vui lòng nhập thông tin diện tích và đơn giá để xem kết quả.</p>
          </div>
        ) : (
          <>
            {/* Area Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-1">1. Chi tiết diện tích</h4>
              <div className="space-y-2 text-sm">
                {result.details.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>{item.name} <span className="text-slate-500 text-xs">({item.pct}%)</span></span>
                    <span>{item.area.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m²</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-yellow-400 pt-2 border-t border-slate-700 mt-2">
                  <span>TỔNG DT QUY ĐỔI</span>
                  <span>{result.totalConstructionArea.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m²</span>
                </div>
              </div>
            </div>

            {/* Construction Costs Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-1">2. Chi phí xây dựng</h4>
              <div className="space-y-3 text-sm">
                
                {/* Row A: Rough or Package */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-300">
                    {usePackagePrice ? 'a + b. Chi phí Trọn gói' : 'a. Phần thô + NC Hoàn thiện'}
                  </span>
                  <span className="font-mono font-medium text-blue-300">{formatCurrency(result.costRough)}</span>
                </div>

                {/* Row B: Finish */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-300">
                    {usePackagePrice ? 'b. Chi tiết vật tư' : 'b. Hoàn thiện (Vật tư)'}
                  </span>
                  <span className={`font-mono font-medium ${usePackagePrice ? 'text-xs italic opacity-70 mt-1' : 'text-green-300'}`}>
                    {usePackagePrice ? 'Đã tính trong trọn gói' : formatCurrency(result.costFinish)}
                  </span>
                </div>

                {/* Row C: Pile */}
                <div className="flex justify-between text-slate-300">
                  <span>c. Chi phí Ép cọc</span>
                  <span className="font-mono">{formatCurrency(result.costPile)}</span>
                </div>

                {/* Row D: Garden */}
                <div className="flex justify-between text-slate-300">
                  <span>d. Chi phí Sân vườn</span>
                  <span className="font-mono">{formatCurrency(result.costGarden)}</span>
                </div>

                {/* Row E: Interior Finish */}
                <div className="flex justify-between text-slate-300">
                  <div className="flex flex-col">
                    <span>e. Hoàn thiện Nội thất</span>
                    {result.costInteriorFinish > 0 && (
                      <span className="text-[10px] text-slate-500 italic">(Diện tích: {result.areaInteriorFinish} m²)</span>
                    )}
                  </div>
                  <span className="font-mono text-orange-300">{formatCurrency(result.costInteriorFinish)}</span>
                </div>

              </div>
            </div>

            {/* Soft Costs */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-1">3. Chi phí dịch vụ</h4>
              <div className="space-y-2 text-sm text-slate-300">
                
                {/* Design Fee Breakdown */}
                <div className="pb-2 mb-2 border-b border-slate-700/50">
                    <div className="flex justify-between text-purple-300 font-bold">
                      <span>Tổng Phí thiết kế</span>
                      <span className="font-mono">{formatCurrency(result.totalDesignCost)}</span>
                    </div>
                    <div className="pl-3 mt-1 space-y-1 text-xs text-slate-400 border-l-2 border-slate-700 ml-1">
                        <div className="flex justify-between items-start">
                             <div className="flex flex-col">
                                <span>- Kiến trúc/KC/ME</span>
                                {result.designArchRatio > 0 && (
                                    <span className="text-[10px] text-slate-500 italic">(Chiếm {result.designArchRatio.toFixed(2)}% chi phí xây nhà)</span>
                                )}
                             </div>
                             <span className="font-mono">{formatCurrency(result.costDesignArch)}</span>
                        </div>
                        <div className="flex justify-between">
                             <div className="flex flex-col">
                                <span>- Nội thất</span>
                                {result.designInteriorRatio > 0 && (
                                    <span className="text-[10px] text-slate-500 italic">(Chiếm {result.designInteriorRatio.toFixed(2)}% chi phí xây nhà)</span>
                                )}
                             </div>
                             <span className="font-mono">{formatCurrency(result.costDesignInterior)}</span>
                        </div>
                        <div className="flex justify-between">
                             <div className="flex flex-col">
                                <span>- Cảnh quan</span>
                                {result.designLandscapeRatio > 0 && (
                                    <span className="text-[10px] text-slate-500 italic">(Chiếm {result.designLandscapeRatio.toFixed(2)}% chi phí xây nhà)</span>
                                )}
                             </div>
                             <span className="font-mono">{formatCurrency(result.costDesignLandscape)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between">
                  <span>Giám sát</span>
                  <span className="font-mono">{formatCurrency(result.costSupervision)}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Hoàn công</span>
                  <span className="font-mono">{formatCurrency(result.costAsbuilt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giấy phép xây dựng</span>
                  <span className="font-mono">{formatCurrency(result.costPermit)}</span>
                </div>
                <div className="flex justify-between text-orange-400 font-medium">
                  <span>Dự phòng phí</span>
                  <span className="font-mono">{formatCurrency(result.costContingency)}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t-2 border-slate-600">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold uppercase text-slate-400">Tổng cộng</span>
                <span className="text-xl font-bold text-white font-mono leading-none">{formatCurrency(result.grandTotal)}</span>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-slate-500 mt-4 italic">
              Lưu ý: Toàn bộ số liệu hiện tại chỉ mang tính khái toán tham khảo. Chi phí chính xác sẽ được lập dựa trên hồ sơ thiết kế kỹ thuật hoàn chỉnh.
            </p>
          </>
        )}
      </div>
    </div>
  );
};